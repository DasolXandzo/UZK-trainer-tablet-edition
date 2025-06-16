// Актуальная версия
import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
    const containerRef = useRef(null);
    const simulatorRef = useRef(null);
    const [gridVisible, setGridVisible] = useState(true);
    const [buttonText, setButtonText] = useState("Hide grid");
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [exampleIndex, setExampleState] = useState(0);

    const [centerLeft, setCenterLeft] = useState(0); // крайний левый центральный столбец
    const [centerRight, setCenterRight] = useState(0); // крайний правый центральный столбец

    const handleIncrement = () => {
        setExampleState((prev) => Math.min(10, prev+1))
    }

    const handleDecrement = () => {
        setExampleState((prev) => Math.max(0, prev-1))
    }

    const changeGridVisible = () => {
        if (gridVisible) {
            setGridVisible(false);
            setButtonText("Show grid");
        }
        else {
            setGridVisible(true);
            setButtonText("Hide grid");
        }
        console.log(window.innerHeight, screen.availHeight);
    }

    const rows = 30;
    const cols = 22;

    // Параметры шва в условных единицах
    const seamStart = 500; // начало шва
    const seamLength = 100; // длина шва
    const totalWidth = 1100; // общая ширина области
    const totalHeight = 1200; // общая высота области

    // Константы для пересчета координат
    const cellWidth = 50; // ширина ячейки в условных единицах
    const cellHeight = 40; // высота ячейки в условных единицах
    const leftColumns = 10; // количество столбцов слева от шва
    const rightColumns = 10; // количество столбцов справа от шва

    useEffect (() => {
        // Расчет ширины столбцов слева и справа от шва
        const leftSpace = seamStart;
        const rightSpace = totalWidth - (seamStart + seamLength);
        const leftColumnWidth = leftSpace / leftColumns;
        const rightColumnWidth = rightSpace / rightColumns;

        // Обновляем CSS переменные для сетки
        document.documentElement.style.setProperty('--left-column-width', `${leftColumnWidth}px`);
        document.documentElement.style.setProperty('--right-column-width', `${rightColumnWidth}px`);
        document.documentElement.style.setProperty('--seam-start', `${seamStart}px`);
        document.documentElement.style.setProperty('--seam-length', `${seamLength}px`);
        document.documentElement.style.setProperty('--total-width', `${totalWidth}px`);
        document.documentElement.style.setProperty('--total-height', `${totalHeight}px`);

        // минимальное число cols и rows мне дали 22 и 30 соответственно
        // поэтому их значение может быть либо таким же, либо больше (в идеале, всегда чётное кол-во cols)
        // на всякий случай добавил пересчёт ширины шва
        if (cols == 22) {
            setCenterLeft(Math.floor(cols / 2) - 1);
            setCenterRight(Math.floor(cols / 2));
        } else if (cols > 22) {
            let defaultColWidth = cols / 22;
            setCenterLeft(Math.floor(cols / 2) - defaultColWidth);
            setCenterRight(Math.floor(cols / 2) + defaultColWidth - 1);
        } 

        console.log("processing center cols end");
        console.log("CenterLeft: ", centerLeft);
        console.log("CenterRight: ", centerRight);
    }, []);

    document.documentElement.style.setProperty('--rows', rows);
    document.documentElement.style.setProperty('--cols', cols);

    const [gridState, setGridState] = useState(
        Array(rows).fill().map(() => Array(leftColumns + rightColumns).fill(false))
    );

    const [debugIndex, setDebugIndex] = useState("null");
    const [indexMode, setIndexMode] = useState("cells"); // "cells" или "nodes"

    // индексация клеток
    const getCellIndices = (col, row, side, internalX, internalY) => {
        return (
            <>
                {col}{row + 1}{side}
                <br />
                X: {internalX}
                <br />
                Y: {internalY}
            </>
        );
    };

    // индексация узлов
    const getNodeIndices = (col, row, side, internalX, internalY) => {
        return (
            <>
                {col}{row + 1}{side}, {col + 1}{row + 1}{side}, {col}{row + 2}{side}, {col + 1}{row + 2}{side}
                <br />
                X: {internalX}
                <br />
                Y: {internalY}
            </>
        );
    };

    const handlePointerMove = (event) => {
        if (event.pointerType !== "pen"){
            containerRef.current.style.cursor = "default";
            simulatorRef.current.style.pointerEvents = "auto";
            return;
        }
        else{
            containerRef.current.style.cursor = "none";
            simulatorRef.current.style.pointerEvents = "none";
        }
    
        const container = containerRef.current;
        if (!container) return;
    
        const { left, top, width, height } = container.getBoundingClientRect();
    
        const relativeX = event.clientX - left;
        const relativeY = event.clientY - top;
    
        // Переводим координаты в условные единицы
        const absoluteX = (relativeX / width) * totalWidth;
        const absoluteY = (relativeY / height) * totalHeight;
    
        let row = Math.min(rows - 1, Math.floor(absoluteY / cellHeight));
        let col, side;
    
        // Определяем положение относительно шва
        let gridColIndex; // индекс для gridState
        if (absoluteX < seamStart) {
            // Левая часть
            const leftColumnWidth = seamStart / leftColumns;
            col = leftColumns - Math.floor(absoluteX / leftColumnWidth);
            side = "l";
            gridColIndex = Math.floor(absoluteX / leftColumnWidth); // для gridState
        } else if (absoluteX > seamStart + seamLength) {
            // Правая часть
            const rightColumnWidth = (totalWidth - (seamStart + seamLength)) / rightColumns;
            col = Math.floor((absoluteX - (seamStart + seamLength)) / rightColumnWidth) + 1;
            side = "r";
            gridColIndex = leftColumns + Math.floor((absoluteX - (seamStart + seamLength)) / rightColumnWidth); // для gridState
        } else {
            // Шов
            col = 0;
            side = null;
            gridColIndex = -1; // неактивная ячейка
        }
    
        // Расчет внутренних координат ячейки
        const cellLeft = side === "l" ? 
            (leftColumns - col) * (seamStart / leftColumns) : 
            seamStart + seamLength + (col - 1) * ((totalWidth - (seamStart + seamLength)) / rightColumns);
        
        const internalX = Math.floor((absoluteX - cellLeft) * (cellWidth / (side === "l" ? seamStart / leftColumns : (totalWidth - (seamStart + seamLength)) / rightColumns)));
        const internalY = Math.floor((absoluteY % cellHeight) * (cellHeight / cellHeight));
    
        if (col === 0) {
            setDebugIndex("null");
        } else {
            if (indexMode === "cells") {
                setDebugIndex(getCellIndices(col, row, side, internalX, internalY));
            } else {
                setDebugIndex(getNodeIndices(col, row, side, internalX, internalY));
            }
        }
    
        setGridState((prevGrid) =>
            prevGrid.map((r, rIndex) =>
                r.map((c, cIndex) => (rIndex === row && cIndex === gridColIndex ? true : false))
            )
        );
    };

    return isFullscreen ? (
        <div className="container" ref={containerRef} onPointerMove={handlePointerMove}>
            
            {/* Отображение сетки */}
            { gridVisible && (
                <>
                    {/* Основная сетка с делением на области */}
                    <div className="grid-overlay" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex'
                    }}>
                        {/* Левая часть сетки */}
                        <div style={{
                            width: `${(seamStart / totalWidth) * 100}%`,
                            height: '100%',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${leftColumns}, 1fr)`,
                            gridTemplateRows: `repeat(${rows}, 1fr)`
                        }}>
                            {gridState.map((row, rowIndex) =>
                                row.slice(0, leftColumns).map((cell, colIndex) => (
                                    <div
                                        key={`left-${rowIndex}-${colIndex}`}
                                        className={`grid-cell ${cell ? "active" : ""}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: '1px solid rgb(0, 0, 0)'
                                        }}
                                    ></div>
                                ))
                            )}
                        </div>

                        {/* Шов */}
                        <div style={{
                            width: `${(seamLength / totalWidth) * 100}%`,
                            height: '100%',
                            backgroundColor: '#696969'
                        }}></div>

                        {/* Правая часть сетки */}
                        <div style={{
                            width: `${((totalWidth - (seamStart + seamLength)) / totalWidth) * 100}%`,
                            height: '100%',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${rightColumns}, 1fr)`,
                            gridTemplateRows: `repeat(${rows}, 1fr)`
                        }}>
                            {gridState.map((row, rowIndex) =>
                                row.slice(leftColumns).map((cell, colIndex) => (
                                    <div
                                        key={`right-${rowIndex}-${colIndex}`}
                                        className={`grid-cell ${cell ? "active" : ""}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: '1px solid rgb(0, 0, 0)'
                                        }}
                                    ></div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        
            <div className="debug-overlay" ref={simulatorRef}>
                <p>Индекс: {debugIndex}</p>
                <div className='button-block'>
                    <button onClick={handleDecrement}>-</button>
                    <p>Образец: {exampleIndex}</p>
                    <button onClick={handleIncrement}>+</button>
                </div>
                
                {/* Переключатель режима индексации */}
                <div className="index-mode-switcher">
                    <label>Режим индексации: </label>
                    <select 
                        value={indexMode} 
                        onChange={(e) => setIndexMode(e.target.value)}
                    >
                        <option value="cells">Ячейки</option>
                        <option value="nodes">Узлы</option>
                    </select>
                </div>
                
                {/* Кнопка переключения состояния отображения сетки (очевидно, бессмысленно при отсутсвии сетки) */}
                <button onClick={changeGridVisible}>{buttonText}</button>

            </div>

        </div>
    ) : (
        <div style={{ textAlign: "center", padding: "20px", fontSize: "20px" }}>
          Работа сервиса приостановлена. Чтобы продолжить работу, разверните браузер на весь экран.
        </div>
      );
}


// старая версия (оставил прозапас)
// import React, { useEffect, useRef, useState } from "react";
// import "./App.css";

// export default function App() {
//     const containerRef = useRef(null);
//     const imageRef = useRef(null);
//     const cursorRef = useRef(null);
//     const [mode, setMode] = useState("cursor");
//     const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, mappedX: 0, mappedY: 0 });

//     // строки и столбцы в соответствии с количеством секторов на планшете
//     const rows = 30;
//     const cols = 22;
//     document.documentElement.style.setProperty('--rows', rows);
//     document.documentElement.style.setProperty('--cols', cols);
//     const prevCell = useRef(null);
//     const [gridState, setGridState] = useState(
//         Array(rows).fill().map(() => Array(cols).fill(false))
//     );

//     useEffect(() => {
//         const handlePointerMove = (event) => {

//             // работа только с пером
//             if (event.pointerType !== "pen"){
//                 containerRef.current.style.cursor = "default";
//                 return;
//             }
//             else{
//                 containerRef.current.style.cursor = "default";
//             }

//             const screenWidth = document.documentElement.clientWidth; // window.innerWidth;
//             const screenHeight = document.documentElement.clientHeight; // window.innerHeight;
        
//             // взятие изображения и виртуального курсора
//             const img = imageRef.current;
//             const cursor = cursorRef.current;
//             if (!img || !cursor) return;
        
//             const rect = img.getBoundingClientRect();
//             const imgWidth = rect.width;
//             const imgHeight = rect.height;
        
//             // расчёт позиции виртуального курсора на изобюражении
//             const mappedX = ((event.clientX / screenWidth) * imgWidth) + rect.left;
//             const mappedY = ((event.clientY / screenHeight) * imgHeight) + rect.top;
        
//             //console.log(`Pointer: (${event.clientX}, ${event.clientY})`);
//             //console.log(`Mapped: (${mappedX}, ${mappedY})`);
//             //console.log(cursor);
        
//             if (mode === "cursor") {
//                 // через cursor.style.left и cursor.style.top 
//                 // у меня отказывается работать, поэтому пошёл через setAttribute()
//                 cursor.setAttribute("style", `position: fixed; left: ${mappedX}px; top: ${mappedY}px; transform: none;`);
//                 cursor.style.display = "block";
//             } else {
//                 cursor.style.display = "none";
                
//                 // обнаружение сектора
//                 const row = Math.floor((event.clientY / imgHeight) * rows);
//                 const col = Math.floor((event.clientX / imgWidth) * cols);

//                 if (row >= 0 && row < rows && col >= 0 && col < cols) {
//                     const currentCell = '${row}-${col}';
            
//                     if (currentCell !== prevCell) {
//                         setGridState((prevGrid) => {
//                             const newGrid = prevGrid.map((r, rIndex) =>
//                                 r.map((c, cIndex) => (rIndex === row && cIndex === col ? true : false))
//                             );
//                             return newGrid;
//                         });
            
//                         prevCell = currentCell;
//                     }
//                 }
//             }
        
//             setDebugInfo({ x: event.clientX, y: event.clientY, mappedX, mappedY });
//         };

//         window.addEventListener("pointermove", handlePointerMove);
//         return () => window.removeEventListener("pointermove", handlePointerMove);
//     }, [mode]);

//     return (
//         <div className="container" ref={containerRef}>

//             {/* переключатель режимов */}
//             <div className="mode-switcher">
//                 <label>Режим: </label>
//                 <select value={mode} onChange={(e) => setMode(e.target.value)}>
//                     <option value="cursor">Виртуальный курсор</option>
//                     <option value="grid">Сетка</option>
//                 </select>
//             </div>

//             <div className="image-container">

//                 {/* изображение */}
//                 <img src="/img1.jpg" alt="Grid Image" className="background-image" ref={imageRef} />

//                 {/* виртуальный курсор */}
//                 <div id="virtual-cursor" ref={cursorRef}></div>

//                  {/* сетка (для режима grid) */}
//                  {mode === "grid" && (
//                     <div className="grid-overlay">
//                         {gridState.map((row, rowIndex) =>
//                             row.map((cell, colIndex) => (
//                                 <div
//                                     key={`${rowIndex}-${colIndex}`}
//                                     className={`grid-cell ${cell ? "active" : ""}`}
//                                     style={{
//                                         width: 'calc(100% / ${cols})',
//                                         height: 'calc(100% / ${rows})'
//                                     }}
//                                 ></div>
//                             ))
//                         )}
//                     </div>
//                 )}

//             </div>

//             {/* отладка */}
//             <div className="debug-info">
//                 <p>Перо: X = {debugInfo.x}, Y = {debugInfo.y}</p>
//                 <p>На изображении: X = {debugInfo.mappedX.toFixed(2)}, Y = {debugInfo.mappedY.toFixed(2)}</p>
//             </div>

//         </div>
//     );
// }