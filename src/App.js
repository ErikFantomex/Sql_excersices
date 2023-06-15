import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    // Se realiza una petición HTTP GET para obtener los datos de las fotos
    fetch("https://jsonplaceholder.typicode.com/photos")
      .then((response) => response.json())
      .then((data) => setPhotos(data));
  }, []);

  const addMoveable = () => {
    const COLORS = ["red", "blue", "yellow", "green", "purple"];

    // Se agrega un nuevo componente Moveable con valores iniciales aleatorios a la lista de componentes
    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        updateEnd: true,
      },
    ]);
  };

  const removeMoveable = (id) => {
    // Se remueve un componente Moveable de la lista de componentes
    const updatedMoveables = moveableComponents.filter(
      (moveable) => moveable.id !== id
    );
    setMoveableComponents(updatedMoveables);
    if (selected === id) {
      setSelected(null);
    }
  };

  const updateMoveable = (id, newComponent, updateEnd = false) => {
    // Se actualiza un componente Moveable con nuevos valores
    const updatedMoveables = moveableComponents.map((moveable) =>
      moveable.id === id ? { id, ...newComponent, updateEnd } : moveable
    );
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (index, e) => {
    const [handlePosX] = e.direction;

    if (handlePosX === -1) {
      const initialLeft = e.left;
      const initialWidth = e.width;

      // Se establece el evento onResize para actualizar la posición izquierda en función del cambio de ancho
      e.onResize = ({ width }) => {
        const deltaWidth = width - initialWidth;
        const newLeft = initialLeft - deltaWidth;
        updateMoveable(e.target.id, { left: newLeft, width }, false);
      };
    }
  };

  const parentRef = useRef(null); // Referencia al contenedor padre

  return (
    <main style={{ height: "100vh", width: "100vw" }}>
      <button onClick={addMoveable}>Add Moveable</button>
      <div
        id="parent"
        ref={parentRef} // Referencia al contenedor padre
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            index={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
            removeMoveable={removeMoveable}
            photo={photos[index % photos.length]}
            parentRef={parentRef} // Pasa la referencia del contenedor padre al componente Moveable
          />
        ))}
      </div>
    </main>
  );
};

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
  removeMoveable,
  photo,
  parentRef, // Recibe la referencia al contenedor padre
}) => {
  const ref = useRef();
  const moveableRef = useRef();

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
  });

  const onResize = (e) => {
    const newWidth = e.width;
    const newHeight = e.height;

    // Se actualiza el componente Moveable con los nuevos valores
    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
    });

    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = (e) => {
    const newWidth = e.lastEvent?.width;
    const newHeight = e.lastEvent?.height;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    // Se actualiza el componente Moveable con los nuevos valores finales
    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
          background: color,
        }}
        onClick={() => setSelected(id)}
      >
        <img
          src={photo?.url}
          alt={photo?.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
        />
        <button onClick={() => removeMoveable(id)} style={{ zIndex: 999 }}>
          Remove
        </button>
      </div>

      <Moveable
        ref={moveableRef}
        target={ref.current}
        resizable
        draggable
        onDrag={(e) => {
          // Se actualiza el componente Moveable durante el arrastre
          updateMoveable(id, {
            top: e.top,
            left: e.left,
            width,
            height,
            color,
          });
        }}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        onDragEnd={() => updateMoveable(id, { top, left, width, height, color }, true)}
        parent={parentRef.current} // Establece el contenedor padre
        origin={false}
        keepRatio={false}
        edge={false}
        throttleResize={0}
        throttleDrag={0}
        renderDirections={["nw", "ne", "sw", "se"]}
        rotatable={false}
        snappable={true}
        snappers={[
          // Permite que el componente se ajuste a los bordes del contenedor padre
          ({ left, top, right, bottom }) => [Math.round(left), Math.round(top), Math.round(right), Math.round(bottom)],
        ]}
        snappableRadius={10}
        snapCenter={true}
        snapVertical={true}
        snapHorizontal={true}
        onRenderEnd={() => updateMoveable(id, { top, left, width, height, color }, true)}
      />
    </>
  );
};

export default App;
