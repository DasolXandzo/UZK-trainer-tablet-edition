// Актуальная версия
import { useEffect, useRef, useState, useMemo } from "react";
import "./App.css";

export default function App() {
  const rows = 30;
  const cols = 20;

  // Параметры рабочей области в условных единицах
  const totalWidth = 215; // общая ширина области в мм
  const totalHeight = 140; // общая высота области в мм

  // Константы для пересчета координат
  const cellWidth = 50;
  const cellHeight = 40;
  const columnsCount = 10; // количество столбцов справа и слева от шва

  const containerRef = useRef(null);
  const simulatorRef = useRef(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [buttonText, setButtonText] = useState("Hide grid");
  //const [isFullscreen, setIsFullscreen] = useState(true);

  // получаемая информация
  const [seamLength, setSeamLength] = useState(15); // ширина шва в мм
  const [usefulZone, setUsefulZone] = useState(100); // ширина полезной зоны в мм

  // размера областей в px для отрисовки
  const pointOfWidth = window.innerWidth / totalWidth;
  const usefulZonePx = useMemo(() => usefulZone * pointOfWidth, [usefulZone, pointOfWidth]);
  const seamLengthPx = useMemo(() => seamLength * pointOfWidth, [seamLength, pointOfWidth]);
  const seamStartPx = useMemo(() => (window.innerWidth - seamLengthPx) / 2, [seamLengthPx]);
  const emptyZonePx = useMemo(() => seamStartPx - usefulZonePx, [seamStartPx, usefulZonePx]);
  const cellWidthPx = useMemo(() => usefulZonePx / columnsCount, [usefulZonePx]);
  const cellHeightPx = useMemo(() => window.innerHeight / rows, []);

  // значения X координат активных областей для рассчёта
  const leftZoneStart = useMemo(() => emptyZonePx, [emptyZonePx]);
  const leftZoneEnd = useMemo(() => seamStartPx, [seamStartPx]);
  const rightZoneStart = useMemo(() => seamStartPx + seamLengthPx, [seamStartPx, seamLengthPx]);
  const rightZoneEnd = useMemo(() => window.innerWidth - emptyZonePx, [emptyZonePx]);

  // const changeGridVisible = () => {
  //     if (gridVisible) {
  //         setGridVisible(false);
  //         setButtonText("Show grid");
  //     }
  //     else {
  //         setGridVisible(true);
  //         setButtonText("Hide grid");
  //     }
  //     console.log(window.innerHeight, screen.availHeight);
  // }

  useEffect (() => {
      console.log("CellWidth: ", cellWidthPx);
      console.log("CellHeight: ", cellHeightPx);

      // Обновляем CSS переменные для сетки
      document.documentElement.style.setProperty('--left-column-width', `${cellWidthPx}px`);
      document.documentElement.style.setProperty('--right-column-width', `${cellWidthPx}px`);
      document.documentElement.style.setProperty('--seam-start', `${seamStartPx}px`);
      document.documentElement.style.setProperty('--seam-length', `${seamLengthPx}px`);
      document.documentElement.style.setProperty('--total-width', `${window.innerWidth}px`);
      document.documentElement.style.setProperty('--total-height', `${window.innerHeight}px`);
  }, [seamLength, usefulZone]);

  document.documentElement.style.setProperty('--rows', rows);
  document.documentElement.style.setProperty('--cols', cols);

  const [gridState, setGridState] = useState(
      Array(rows).fill().map(() => Array(columnsCount * 2).fill(false))
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
          //return;
      }
      else{
          containerRef.current.style.cursor = "none";
          simulatorRef.current.style.pointerEvents = "none";
      }
  
      const container = containerRef.current;
      if (!container) return;

      const absoluteX = event.clientX;
      const absoluteY = event.clientY;

      let row = Math.min(29, Math.floor(absoluteY / cellHeightPx));
      let col = 0, side = null, gridColIndex = -1;
      let showIndex = true;

      // Левая usefulZone
      if (absoluteX >= leftZoneStart && absoluteX < leftZoneEnd) {
          const localX = absoluteX - leftZoneStart;
          col = columnsCount - Math.floor(localX / cellWidthPx);
          side = "l";
          gridColIndex = columnsCount - col;
      } else if (absoluteX >= rightZoneStart && absoluteX < rightZoneEnd) {
          // Правая usefulZone
          const localX = absoluteX - rightZoneStart;
          col = Math.floor(localX / cellWidthPx) + 1;
          side = "r";
          gridColIndex = 10 + (col - 1);
      } else if (absoluteX >= leftZoneEnd && absoluteX < rightZoneStart) {
          // На шве
          setDebugIndex("null");
          showIndex = false;
          gridColIndex = -1;
      } else {
          // Вне usefulZone
          setDebugIndex(0);
          showIndex = false;
          gridColIndex = -1;
      }

      let internalX = 0, internalY = 0;
      if (showIndex && col !== 0) {
        let cellLeft = 0;
      
        if (side === "l") {
          cellLeft = leftZoneStart + (columnsCount - col) * cellWidthPx;
        } else if (side === "r") {
          cellLeft = rightZoneStart + (col - 1) * cellWidthPx;
        }
      
        internalX = Math.floor(((absoluteX - cellLeft) / cellWidthPx) * cellWidth);
        internalY = Math.floor(((absoluteY % cellHeightPx) / cellHeightPx) * cellHeight);
      }

      if (!showIndex || col === 0) {
          // уже выставлено выше
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

  return (
      <div 
          className="container"
          ref={containerRef}
          onPointerMove={handlePointerMove}
      >
        <div
          style={{
            width: `${window.innerWidth}px`,
            height: `${window.innerHeight}px`,
            position: 'relative',
            display: 'flex',
            boxSizing: 'content-box',
            background: '#fff',
          }}
        >
          {/* Левая белая область */}
          <div style={{
            width: `${emptyZonePx}px`,
            height: '100%',
            background: '#fff',
          }}></div>

          {/* Левая сетка */}
          <div style={{
            width: `${usefulZonePx}px`,
            height: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(30, 1fr)',
          }}>
            {gridState.map((row, rowIndex) =>
              row.slice(0, 10).map((cell, colIndex) => (
                <div
                  key={`left-${rowIndex}-${colIndex}`}
                  className={`grid-cell ${cell ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid rgb(0, 0, 0)',
                  }}
                ></div>
              ))
            )}
          </div>

          {/* Шов */}
          <div style={{
            width: `${seamLengthPx}px`,
            height: '100%',
            background: '#696969',
          }}></div>

          {/* Правая сетка */}
          <div style={{
            width: `${usefulZonePx}px`,
            height: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(30, 1fr)',
          }}>
            {gridState.map((row, rowIndex) =>
              row.slice(10).map((cell, colIndex) => (
                <div
                  key={`right-${rowIndex}-${colIndex}`}
                  className={`grid-cell ${cell ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid rgb(0, 0, 0)',
                  }}
                ></div>
              ))
            )}
          </div>

          {/* Правая белая область */}
          <div style={{
            width: `${emptyZonePx}px`,
            height: '100%',
            background: '#fff',
          }}></div>
        </div>

        <div className="debug-overlay" ref={simulatorRef}>
          <p>Индекс: {debugIndex}</p>
          
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

          <div>
              Ширина шва: 
              <input id="seamLengthInput"
                  type="number"
                  min={10}
                  max={100}
                  onChange={(e) => setSeamLength(Number(e.target.value))}
                  value={seamLength}
              />
          </div>

          <div>
              Ширина полезной зоны: 
              <input id="usefulZoneInput"
                  type="number"
                  min={10}
                  max={100}
                  onChange={(e) => setUsefulZone(Number(e.target.value))}
                  value={usefulZone}
              />
          </div>
          
          {/* Кнопка переключения состояния отображения сетки (очевидно, бессмысленно при отсутсвии сетки) */}
          {/*<button onClick={changeGridVisible}>{buttonText}</button>*/}

        </div>
      </div>
  );
}

// export default function App() {
//     const containerRef = useRef(null);
//     const simulatorRef = useRef(null);
//     const [gridVisible, setGridVisible] = useState(true);
//     const [buttonText, setButtonText] = useState("Hide grid");
//     const [isFullscreen, setIsFullscreen] = useState(true);
//     const [exampleIndex, setExampleState] = useState(0);

//     const [centerLeft, setCenterLeft] = useState(0); // крайний левый центральный столбец
//     const [centerRight, setCenterRight] = useState(0); // крайний правый центральный столбец
//     const [seamStart, setSeamStart] = useState(0); // начальная координата шва в мм
//     const [seamLength, setSeamLength] = useState(100); // ширина шва в мм
//     const [usefulZone, setUsefulZone] = useState(400); // ширина полезной зоны в мм

//     const [leftZoneStart, setLeftZoneStart] = useState(0);
//     const [leftZoneEnd, setLeftZoneEnd] = useState(0);
//     const [rightZoneStart, setRightZoneStart] = useState(0);
//     const [rightZoneEnd, setRightZoneEnd] = useState(0);

//     const handleIncrement = () => {
//         setExampleState((prev) => Math.min(10, prev+1))
//     }

//     const handleDecrement = () => {
//         setExampleState((prev) => Math.max(0, prev-1))
//     }

//     const changeGridVisible = () => {
//         if (gridVisible) {
//             setGridVisible(false);
//             setButtonText("Show grid");
//         }
//         else {
//             setGridVisible(true);
//             setButtonText("Hide grid");
//         }
//         console.log(window.innerHeight, screen.availHeight);
//     }

//     const rows = 30;
//     const cols = 22;

//     // Параметры рабочей области в условных единицах
//     const totalWidth = 1100; // общая ширина области
//     const totalHeight = 1200; // общая высота области

//     // Константы для пересчета координат
//     const cellWidth = 50;
//     const cellHeight = 40;
//     const leftColumns = 10; // количество столбцов слева от шва
//     const rightColumns = 10; // количество столбцов справа от шва

//     useEffect (() => {
//         // Расчет начала шва, ширины столбцов слева и справа от шва
//         setSeamStart((totalWidth - seamLength) / 2);
//         const leftColumnWidth = usefulZone / leftColumns;
//         const rightColumnWidth = usefulZone / rightColumns;
//         const seamEnd = seamStart + seamLength;
//         setLeftZoneEnd(seamStart);
//         setLeftZoneStart(seamStart - usefulZone);
//         setRightZoneStart(seamEnd);
//         setRightZoneEnd(seamEnd + usefulZone);

//         // Обновляем CSS переменные для сетки
//         document.documentElement.style.setProperty('--left-column-width', `${leftColumnWidth}px`);
//         document.documentElement.style.setProperty('--right-column-width', `${rightColumnWidth}px`);
//         document.documentElement.style.setProperty('--seam-start', `${seamStart}px`);
//         document.documentElement.style.setProperty('--seam-length', `${seamLength}px`);
//         document.documentElement.style.setProperty('--total-width', `${totalWidth}px`);
//         document.documentElement.style.setProperty('--total-height', `${totalHeight}px`);

//         // минимальное число cols и rows мне дали 22 и 30 соответственно
//         if (cols == 22) {
//             setCenterLeft(Math.floor(cols / 2) - 1);
//             setCenterRight(Math.floor(cols / 2));
//         } else if (cols > 22) {
//             let defaultColWidth = cols / 22;
//             setCenterLeft(Math.floor(cols / 2) - defaultColWidth);
//             setCenterRight(Math.floor(cols / 2) + defaultColWidth - 1);
//         } 

//         console.log("processing center cols end");
//         console.log("CenterLeft: ", centerLeft);
//         console.log("CenterRight: ", centerRight);
//     }, [seamLength, usefulZone]);

//     document.documentElement.style.setProperty('--rows', rows);
//     document.documentElement.style.setProperty('--cols', cols);

//     const [gridState, setGridState] = useState(
//         Array(rows).fill().map(() => Array(leftColumns + rightColumns).fill(false))
//     );

//     const [debugIndex, setDebugIndex] = useState("null");
//     const [indexMode, setIndexMode] = useState("cells"); // "cells" или "nodes"

//     // индексация клеток
//     const getCellIndices = (col, row, side, internalX, internalY) => {
//         return (
//             <>
//                 {col}{row + 1}{side}
//                 <br />
//                 X: {internalX}
//                 <br />
//                 Y: {internalY}
//             </>
//         );
//     };

//     // индексация узлов
//     const getNodeIndices = (col, row, side, internalX, internalY) => {
//         return (
//             <>
//                 {col}{row + 1}{side}, {col + 1}{row + 1}{side}, {col}{row + 2}{side}, {col + 1}{row + 2}{side}
//                 <br />
//                 X: {internalX}
//                 <br />
//                 Y: {internalY}
//             </>
//         );
//     };

//     const handlePointerMove = (event) => {
//         if (event.pointerType !== "pen"){
//             containerRef.current.style.cursor = "default";
//             simulatorRef.current.style.pointerEvents = "auto";
//             return;
//         }
//         else{
//             containerRef.current.style.cursor = "none";
//             simulatorRef.current.style.pointerEvents = "none";
//         }
    
//         const container = containerRef.current;
//         if (!container) return;

//         const { left, top, width, height } = container.getBoundingClientRect();
//         const relativeX = event.clientX - left;
//         const relativeY = event.clientY - top;
//         const absoluteX = (relativeX / width) * totalWidth;
//         const absoluteY = (relativeY / height) * totalHeight;

//         let row = Math.min(29, Math.floor(absoluteY / cellHeight));
//         let col = 0, side = null, gridColIndex = -1;
//         let showIndex = true;

//         // Левая usefulZone
//         if (absoluteX >= leftZoneStart && absoluteX < leftZoneEnd) {
//             const localX = absoluteX - leftZoneStart;
//             col = Math.floor(localX / cellWidth) + 1;
//             side = "l";
//             gridColIndex = col - 1;
//         } else if (absoluteX >= rightZoneStart && absoluteX < rightZoneEnd) {
//             // Правая usefulZone
//             const localX = absoluteX - rightZoneStart;
//             col = Math.floor(localX / cellWidth) + 1;
//             side = "r";
//             gridColIndex = 10 + (col - 1);
//         } else if (absoluteX >= leftZoneEnd && absoluteX < rightZoneStart) {
//             // На шве
//             setDebugIndex("null");
//             showIndex = false;
//             gridColIndex = -1;
//         } else {
//             // Вне usefulZone
//             setDebugIndex(0);
//             showIndex = false;
//             gridColIndex = -1;
//         }

//         let internalX = 0, internalY = 0;
//         if (showIndex && col !== 0) {
//             let cellLeft = 0;
//             if (side === "l") {
//                 cellLeft = leftZoneStart + (col - 1) * cellWidth;
//             } else if (side === "r") {
//                 cellLeft = rightZoneStart + (col - 1) * cellWidth;
//             }
//             internalX = Math.floor((absoluteX - cellLeft) * (cellWidth / cellWidth));
//             internalY = Math.floor((absoluteY % cellHeight) * (cellHeight / cellHeight));
//         }

//         if (!showIndex || col === 0) {
//             // уже выставлено выше
//         } else {
//             if (indexMode === "cells") {
//                 setDebugIndex(getCellIndices(col, row, side, internalX, internalY));
//             } else {
//                 setDebugIndex(getNodeIndices(col, row, side, internalX, internalY));
//             }
//         }

//         setGridState((prevGrid) =>
//             prevGrid.map((r, rIndex) =>
//                 r.map((c, cIndex) => (rIndex === row && cIndex === gridColIndex ? true : false))
//             )
//         );
//     };

//     return isFullscreen ? (
//         <div 
//             className="container"
//             ref={containerRef}
//             onPointerMove={handlePointerMove}
//         >
//           <div
//             style={{
//               width: `${totalWidth}px`,
//               height: `${totalHeight}px`,
//               position: 'relative',
//               display: 'flex',
//               boxSizing: 'content-box',
//               background: '#fff',
//             }}
//           >
//             {/* Левая белая область */}
//             <div style={{
//               width: `${leftZoneStart}px`,
//               height: '100%',
//               background: '#fff',
//             }}></div>

//             {/* Левая сетка */}
//             <div style={{
//               width: `${usefulZone/totalWidth * 100}%`,
//               height: '100%',
//               display: 'grid',
//               gridTemplateColumns: 'repeat(10, 1fr)',
//               gridTemplateRows: 'repeat(30, 1fr)',
//             }}>
//               {gridState.map((row, rowIndex) =>
//                 row.slice(0, 10).map((cell, colIndex) => (
//                   <div
//                     key={`left-${rowIndex}-${colIndex}`}
//                     className={`grid-cell ${cell ? 'active' : ''}`}
//                     style={{
//                       width: '100%',
//                       height: '100%',
//                       border: '1px solid rgb(0, 0, 0)',
//                     }}
//                   ></div>
//                 ))
//               )}
//             </div>

//             {/* Шов */}
//             <div style={{
//               width: `${seamLength}px`,
//               height: '100%',
//               background: '#696969',
//             }}></div>

//             {/* Правая сетка */}
//             <div style={{
//               width: `${usefulZone}px`,
//               height: '100%',
//               display: 'grid',
//               gridTemplateColumns: 'repeat(10, 1fr)',
//               gridTemplateRows: 'repeat(30, 1fr)',
//             }}>
//               {gridState.map((row, rowIndex) =>
//                 row.slice(10).map((cell, colIndex) => (
//                   <div
//                     key={`right-${rowIndex}-${colIndex}`}
//                     className={`grid-cell ${cell ? 'active' : ''}`}
//                     style={{
//                       width: '100%',
//                       height: '100%',
//                       border: '1px solid rgb(0, 0, 0)',
//                     }}
//                   ></div>
//                 ))
//               )}
//             </div>

//             {/* Правая белая область */}
//             <div style={{
//               width: `${totalWidth - rightZoneEnd}px`,
//               height: '100%',
//               background: '#fff',
//             }}></div>
//           </div>

//           <div className="debug-overlay" ref={simulatorRef}>
//             <p>Индекс: {debugIndex}</p>
//             <div className='button-block'>
//                 <button onClick={handleDecrement}>-</button>
//                 <p>Образец: {exampleIndex}</p>
//                 <button onClick={handleIncrement}>+</button>
//             </div>
            
//             {/* Переключатель режима индексации */}
//             <div className="index-mode-switcher">
//                 <label>Режим индексации: </label>
//                 <select 
//                     value={indexMode} 
//                     onChange={(e) => setIndexMode(e.target.value)}
//                 >
//                     <option value="cells">Ячейки</option>
//                     <option value="nodes">Узлы</option>
//                 </select>
//             </div>

//             <div>
//                 Ширина шва: 
//                 <input id="seamLengthInput"
//                     type="number"
//                     min={10}
//                     max={1000}
//                     onChange={(e) => setSeamLength(Number(e.target.value))}
//                     value={seamLength}
//                 />
//             </div>

//             <div>
//                 Шорина полезной зоны: 
//                 <input id="usefulZoneInput"
//                     type="number"
//                     min={10}
//                     max={1000}
//                     onChange={(e) => setUsefulZone(Number(e.target.value))}
//                     value={usefulZone}
//                 />
//             </div>
            
//             {/* Кнопка переключения состояния отображения сетки (очевидно, бессмысленно при отсутсвии сетки) */}
//             <button onClick={changeGridVisible}>{buttonText}</button>

//           </div>
//         </div>
//     ) : (
//         <div style={{ textAlign: "center", padding: "20px", fontSize: "20px" }}>
//           Работа сервиса приостановлена. Чтобы продолжить работу, разверните браузер на весь экран.
//         </div>
//       );
// }


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