# Kế hoạch Triển khai Bảng Ký hiệu Nước đi (Move List Panel)

## Tóm tắt Mục tiêu
Hiện tại trình phát PGN đã có bảng điều hướng (Next, Prev) và hoạt động trơn tru. Tuy nhiên, người dùng cần một Bảng Ký hiệu Nước đi (Move List) hiển thị toàn bộ lịch sử các nước đi của ván cờ (ví dụ: `1. e4 e5 2. Nf3...`). Bảng này phải:
1. Hiển thị rõ ràng số thứ tự nước đi cùng với ký hiệu di chuyển của Trắng và Đen.
2. Nước đi hiện tại trên bàn cờ phải được bôi đậm (Highlight) để người đọc dễ theo dõi.
3. Có thể click thẳng vào một ký hiệu nước đi trong bảng để bàn cờ lập tức nhảy đến thế cờ đó.

## Phân tích Kỹ thuật
- `chess.js` cung cấp `game.history()` trả về mảng các nước đi (Standard Algebraic Notation - SAN) dạng `['e4', 'e5', 'Nf3', ...]`.
- `currentIndex` trong React Component của chúng ta tương ứng với vị trí trong mảng FEN. Index `0` là vị trí bắt đầu, index `1` là sau nước đi đầu tiên (`e4`), v.v.
- Ta sẽ nhóm mảng `history` thành từng cặp `[Trắng, Đen]` để hiển thị.
- Để đảm bảo giao diện đẹp trên cả điện thoại và máy tính, ta sẽ dùng **Flexbox**. Bàn cờ nằm bên trái, danh sách nước đi (có thanh cuộn scrollbar) nằm bên phải (trên Desktop) hoặc rớt xuống dưới (trên Mobile).

## Các Thay Đổi Đề Xuất (Proposed Changes)

### `packages/plugins/chessfenpgn/src/ChessBoardIsland.tsx`
#### [MODIFY] `ChessBoardIsland.tsx`
Cập nhật Component để trích xuất `history` và render thêm một bảng danh sách các nước đi.

```tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

interface ChessBoardIslandProps {
	fen?: string;
	pgn?: string;
}

export function ChessBoardIsland({ fen, pgn }: ChessBoardIslandProps) {
	// Khởi tạo danh sách FENs và lịch sử nước đi (history)
	const { fens, initialIndex, history } = useMemo(() => {
		if (pgn) {
			const game = new Chess();
			try {
				game.loadPgn(pgn);
				const hist = game.history();
				const replayGame = new Chess();
				const fenList = [replayGame.fen()];
				for (const move of hist) {
					replayGame.move(move);
					fenList.push(replayGame.fen());
				}
				return { fens: fenList, initialIndex: fenList.length - 1, history: hist };
			} catch (e) {
				console.error("Invalid PGN", e);
			}
		} else if (fen) {
			const game = new Chess();
			try {
				game.load(fen);
				return { fens: [game.fen()], initialIndex: 0, history: [] };
			} catch (e) {
				console.error("Invalid FEN", e);
			}
		}
		return { fens: [new Chess().fen()], initialIndex: 0, history: [] };
	}, [fen, pgn]);

	const [currentIndex, setCurrentIndex] = useState(initialIndex);

	useEffect(() => {
		setCurrentIndex(initialIndex);
	}, [initialIndex]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			setCurrentIndex(c => Math.max(0, c - 1));
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			setCurrentIndex(c => Math.min(fens.length - 1, c + 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setCurrentIndex(0);
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			setCurrentIndex(fens.length - 1);
		}
	}, [fens.length]);

	const isPgn = !!pgn && fens.length > 1;

	// Nhóm các nước đi thành từng cặp (Trắng, Đen)
	const movePairs = useMemo(() => {
		const pairs = [];
		for (let i = 0; i < history.length; i += 2) {
			pairs.push({
				moveNumber: Math.floor(i / 2) + 1,
				white: { san: history[i], index: i + 1 },
				black: history[i + 1] ? { san: history[i + 1], index: i + 2 } : null
			});
		}
		return pairs;
	}, [history]);

	return (
		<div 
			style={{ 
				maxWidth: isPgn ? 700 : 400, 
				margin: '20px auto', 
				fontFamily: 'sans-serif', 
				outline: 'none',
				display: 'flex',
				flexWrap: 'wrap',
				gap: '20px',
				justifyContent: 'center'
			}}
			tabIndex={isPgn ? 0 : undefined}
			onKeyDown={isPgn ? handleKeyDown : undefined}
		>
			<div style={{ flex: '1 1 300px', maxWidth: 400 }}>
				<Chessboard position={fens[currentIndex]} arePiecesDraggable={false} />
				
				{isPgn && (
					<div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
						<button 
							onClick={() => setCurrentIndex(0)} 
							disabled={currentIndex === 0}
							style={{...buttonStyle, opacity: currentIndex === 0 ? 0.5 : 1}}
						>⏮</button>
						<button 
							onClick={() => setCurrentIndex(c => Math.max(0, c - 1))} 
							disabled={currentIndex === 0}
							style={{...buttonStyle, opacity: currentIndex === 0 ? 0.5 : 1}}
						>◀</button>
						<button 
							onClick={() => setCurrentIndex(c => Math.min(fens.length - 1, c + 1))} 
							disabled={currentIndex === fens.length - 1}
							style={{...buttonStyle, opacity: currentIndex === fens.length - 1 ? 0.5 : 1}}
						>▶</button>
						<button 
							onClick={() => setCurrentIndex(fens.length - 1)} 
							disabled={currentIndex === fens.length - 1}
							style={{...buttonStyle, opacity: currentIndex === fens.length - 1 ? 0.5 : 1}}
						>⏭</button>
					</div>
				)}
			</div>

			{isPgn && (
				<div style={{ 
					flex: '1 1 200px', 
					maxHeight: 400, 
					overflowY: 'auto',
					backgroundColor: '#f8fafc',
					border: '1px solid #e2e8f0',
					borderRadius: '8px',
					padding: '12px'
				}}>
					<h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>Biên bản ván cờ</h4>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
						{movePairs.map(pair => (
							<div key={pair.moveNumber} style={{ display: 'flex', fontSize: '15px' }}>
								<span style={{ width: '35px', color: '#94a3b8', userSelect: 'none' }}>
									{pair.moveNumber}.
								</span>
								<span 
									style={getMoveStyle(currentIndex === pair.white.index)}
									onClick={() => setCurrentIndex(pair.white.index)}
								>
									{pair.white.san}
								</span>
								{pair.black && (
									<span 
										style={getMoveStyle(currentIndex === pair.black.index)}
										onClick={() => setCurrentIndex(pair.black.index)}
									>
										{pair.black.san}
									</span>
								)}
							</div>
						))}
					</div>
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
	fontSize: '16px',
	transition: 'opacity 0.2s'
};

function getMoveStyle(isActive: boolean): React.CSSProperties {
	return {
		flex: 1,
		cursor: 'pointer',
		padding: '2px 6px',
		borderRadius: '4px',
		backgroundColor: isActive ? '#3b82f6' : 'transparent',
		color: isActive ? '#ffffff' : '#334155',
		fontWeight: isActive ? 'bold' : 'normal',
		textAlign: 'left'
	};
}
```

## Kế hoạch Xác minh (Verification Plan)
- **Manual Verification:** 
  1. Tôi sẽ thay thế nội dung file `ChessBoardIsland.tsx` với đoạn mã đề xuất.
  2. Bạn sẽ F5 lại trang Frontend.
  3. Bàn cờ hiển thị PGN (khối phía dưới) sẽ được bổ sung một bảng danh sách nước đi chuyên nghiệp (Move List) nằm ở bên phải bàn cờ (hoặc bên dưới nếu màn hình hẹp).
  4. Nước đi hiện tại sẽ được đánh dấu bằng màu xanh dương nổi bật (`#3b82f6`).
  5. Khi click vào bất kỳ một nước đi nào trên bảng, bàn cờ sẽ lập tức phản hồi và trượt các quân cờ đến đúng trạng thái đó!

Bạn có đồng ý với kế hoạch bổ sung bảng Biên bản ván cờ (Move List) này không?
