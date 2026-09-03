# Kế hoạch Triển khai Bảng điều khiển PGN (PGN Viewer)

## Tóm tắt Mục tiêu
Tính năng hiển thị PGN hiện tại chỉ vẽ ra thế cờ ở nước đi cuối cùng. Yêu cầu mới là cần bổ sung một bảng điều khiển (Control Panel) bên dưới bàn cờ khi hiển thị PGN, cho phép người dùng lùi lại (Prev), tiến lên (Next), về đầu (Start), và tới cuối (End) trận đấu để xem lại từng nước đi.

## Phân tích Kỹ thuật
Thư viện `chess.js` khi gọi hàm `loadPgn(pgn)` sẽ nạp toàn bộ ván đấu và dừng ở nước đi cuối cùng. Thư viện này không hỗ trợ con trỏ (pointer) để quay lui/tiến tới trực tiếp trên một object game.

Do đó, giải pháp tối ưu cho React là:
1. Khi nhận được PGN, load vào một object `Chess` tạm.
2. Lấy toàn bộ lịch sử nước đi bằng `game.history({ verbose: true })`.
3. Tạo một mảng lưu trữ tất cả các mã FEN tương ứng với từng nước đi (từ lúc bắt đầu đến khi kết thúc).
4. Sử dụng state `currentMoveIndex` trong React để theo dõi nước đi hiện tại đang được xem (hiển thị FEN tương ứng từ mảng trên).
5. Thêm các nút điều khiển (First, Prev, Next, Last) bên dưới bàn cờ. Các nút này sẽ tăng/giảm `currentMoveIndex`.

## Các Thay Đổi Đề Xuất (Proposed Changes)

### `packages/plugins/chessfenpgn/src/ChessBoardIsland.tsx`
#### [MODIFY] `ChessBoardIsland.tsx`
Cập nhật React Component này để hỗ trợ điều hướng:

```tsx
import React, { useState, useEffect, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface ChessBoardIslandProps {
	fen?: string;
	pgn?: string;
}

export function ChessBoardIsland({ fen, pgn }: ChessBoardIslandProps) {
	// Khởi tạo danh sách FENs nếu là PGN
	const { fens, initialIndex } = useMemo(() => {
		if (pgn) {
			const game = new Chess();
			try {
				game.loadPgn(pgn);
				// Lấy lịch sử và tạo mảng FEN
				const history = game.history();
				const replayGame = new Chess();
				const fenList = [replayGame.fen()];
				for (const move of history) {
					replayGame.move(move);
					fenList.push(replayGame.fen());
				}
				return { fens: fenList, initialIndex: fenList.length - 1 };
			} catch (e) {
				console.error("Invalid PGN", e);
			}
		} else if (fen) {
			const game = new Chess();
			try {
				game.load(fen);
				return { fens: [game.fen()], initialIndex: 0 };
			} catch (e) {
				console.error("Invalid FEN", e);
			}
		}
		return { fens: [new Chess().fen()], initialIndex: 0 };
	}, [fen, pgn]);

	const [currentIndex, setCurrentIndex] = useState(initialIndex);

	// Đồng bộ lại index khi fens thay đổi (ví dụ khi prop pgn/fen thay đổi)
	useEffect(() => {
		setCurrentIndex(initialIndex);
	}, [initialIndex]);

	const isPgn = !!pgn && fens.length > 1;

	return (
		<div style={{ maxWidth: 400, margin: '20px auto', fontFamily: 'sans-serif' }}>
			<Chessboard position={fens[currentIndex]} arePiecesDraggable={false} />
			
			{isPgn && (
				<div style={{ 
					display: 'flex', 
					justifyContent: 'center', 
					gap: '10px', 
					marginTop: '15px' 
				}}>
					<button 
						onClick={() => setCurrentIndex(0)} 
						disabled={currentIndex === 0}
						style={buttonStyle}
					>⏮</button>
					<button 
						onClick={() => setCurrentIndex(c => Math.max(0, c - 1))} 
						disabled={currentIndex === 0}
						style={buttonStyle}
					>◀</button>
					<button 
						onClick={() => setCurrentIndex(c => Math.min(fens.length - 1, c + 1))} 
						disabled={currentIndex === fens.length - 1}
						style={buttonStyle}
					>▶</button>
					<button 
						onClick={() => setCurrentIndex(fens.length - 1)} 
						disabled={currentIndex === fens.length - 1}
						style={buttonStyle}
					>⏭</button>
				</div>
			)}
		</div>
	);
}

const buttonStyle = {
	padding: '8px 12px',
	cursor: 'pointer',
	backgroundColor: '#f1f5f9',
	border: '1px solid #cbd5e1',
	borderRadius: '4px',
	fontSize: '16px'
};
```

## Kế hoạch Xác minh (Verification Plan)
- **Manual Verification:** 
  1. Tôi sẽ thay thế nội dung file `ChessBoardIsland.tsx` với đoạn mã trên.
  2. Bạn sẽ F5 lại trang Frontend (`/posts/test-chess`).
  3. Bàn cờ hiển thị PGN (khối phía dưới) sẽ xuất hiện thêm 4 nút điều hướng ⏮ ◀ ▶ ⏭.
  4. Bấm vào các nút sẽ làm bàn cờ thay đổi vị trí quân cờ tương ứng với từng bước đi của ván đấu.
  5. Bàn cờ khối FEN (khối phía trên) vẫn chỉ hiển thị tĩnh và không có nút (vì nó chỉ là một thế cờ).

Bạn có đồng ý với kế hoạch cập nhật này không?
