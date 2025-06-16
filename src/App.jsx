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

    useEffect (() => {
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
    })

    document.documentElement.style.setProperty('--rows', rows);
    document.documentElement.style.setProperty('--cols', cols);

    const [gridState, setGridState] = useState(
        Array(rows).fill().map(() => Array(cols).fill(false))
    );

    const [debugIndex, setDebugIndex] = useState("null");
    const [indexMode, setIndexMode] = useState("cells"); // "cells" или "nodes"

    // индексация клеток
    const getCellIndices = (col, row, side, internalX, internalY) => {
        return (
            <>
                {col}{row + 1}{side}
                <br />
                Y: {internalX}
                <br />
                X: {internalY}
            </>
        );
    };

    // индексация узлов
    const getNodeIndices = (col, row, side, internalX, internalY) => {
        return (
            <>
                {col}{row + 1}{side}, {col + 1}{row + 1}{side}, {col}{row + 2}{side}, {col + 1}{row + 2}{side}
                <br />
                Y: {internalX}
                <br />
                X: {internalY}
            </>
        );
    };

    const handlePointerMove = (event) => {
        //if (event.pointerType !== "pen"){
            containerRef.current.style.cursor = "default";
            simulatorRef.current.style.pointerEvents = "auto";
            //return;
        // }
        // else{
        //     containerRef.current.style.cursor = "none";
        //     simulatorRef.current.style.pointerEvents = "none";
        // }
    
        const container = containerRef.current;
        if (!container) return;
    
        const { left, top, width, height } = container.getBoundingClientRect();
    
        const relativeX = event.clientX - left;
        const relativeY = event.clientY - top;
    
        let row = Math.min(rows - 1, Math.floor((relativeY / height) * rows));
        let colIndex = Math.min(cols - 1, Math.floor((relativeX / width) * cols));
    
        // Calculate internal cell coordinates
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        const internalX = Math.floor((relativeX % cellWidth) * (50 / cellWidth));
        const internalY = Math.floor((relativeY % cellHeight) * (40 / cellHeight));
    
        let col, side;
    
        if (colIndex < centerLeft) {
            col = centerLeft - colIndex;
            side = "l";
        } else if (colIndex > centerRight) {
            col = colIndex - centerRight;
            side = "r";
        } else {
            col = 0;
        }
    
        if (col === 0) {
            setDebugIndex("null");
        } else {
            if (indexMode === "cells") {
                setDebugIndex(getCellIndices(col, row, side, internalX, internalY));
            } else {
                setDebugIndex(getNodeIndices(col, row, side, internalX, internalY));
            }
        }
    
        console.log(`Row=${row + 1}, Col=${col === 0 ? "null" : col}, Side=${side || "center"}, Internal=(${internalX},${internalY})`);
    
        setGridState((prevGrid) =>
            prevGrid.map((r, rIndex) =>
                r.map((c, cIndex) => (rIndex === row && cIndex === colIndex ? true : false))
            )
        );
    };

    return isFullscreen ? (
        <div className="container" ref={containerRef} onPointerMove={handlePointerMove}>
            
            {/* Отображение сетки (бессмысленно при чрезмерно большом колличестве ячеек) */}
            { gridVisible && (<div className="grid-overlay">
                                {gridState.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => (
                                        <div
                                            key={`${rowIndex}-${colIndex}`}
                                            className={`grid-cell ${cell ? "active" : ""}`}
                                            style={{
                                                width: 'calc(100% / ${cols})',
                                                height: 'calc(100% / ${rows})',
                                                backgroundColor: !cell && (cols >= 22 && colIndex >= centerLeft && colIndex <= centerRight) ? "#696969" : undefined
                                            }}
                                        ></div>
                                    ))
                                )}
                            </div>)}
        
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