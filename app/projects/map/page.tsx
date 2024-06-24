'use client'
import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { SketchPicker } from 'react-color';
import styles from '../map/Home.module.css';
import { toast } from 'react-toastify';

const MapPage = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [currentEndpoint, setCurrentEndpoint] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [fetchOnLoad, setFetchOnLoad] = useState(false);
  const [labelSize, setLabelSize] = useState(12); // Varsayılan yazı boyutu
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1); // Varsayılan node boyutu çarpanı
  const [shapes, setShapes] = useState([]); // Çizimler için state
  const [shapeHistory, setShapeHistory] = useState([]); // Çizimlerin tarihçesi
  const [dragMode, setDragMode] = useState('pan'); // Varsayılan drag mode'u
  const [shapeColor, setShapeColor] = useState('#000000'); // Varsayılan çizim rengi

  useEffect(() => {
    if (fetchOnLoad) {
      fetchData();
    }
  }, [fetchOnLoad]);

  useEffect(() => {
    const handleUndo = (event) => {
      if (event.ctrlKey && event.key === 'z') {
        undoLastShape();
      }
    };
    window.addEventListener('keydown', handleUndo);
    return () => {
      window.removeEventListener('keydown', handleUndo);
    };
  }, [shapes, shapeHistory]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/data${currentEndpoint}?page=${page}`);
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const jsonData = await response.json();
      setData(prevData => [...prevData, ...jsonData.data]);
      setTotalPages(jsonData.total_pages);
      if (page === jsonData.total_pages) {
        toast.success('All data fetched');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleMoreClick = async () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
      setFetchOnLoad(true);

      // Toast mesajını göster
      toast.promise(fetchData(), {
        loading: 'Fetching more data, please wait...',
        success: 'More data fetched successfully',
        error: 'Error fetching more data',
      });
    } else {
      toast.error('All data fetched, you are not able to fetch more');
    }
  };

  const handleEndpointClick = async (endpoint) => {
    setPage(1);
    setCurrentEndpoint(endpoint);
    setData([]);
    setFetchOnLoad(true);

    // Toast mesajını göster
    toast.promise(fetchData(), {
      loading: 'Fetching data, please wait...',
      success: 'Data fetched successfully',
      error: 'Error fetching data',
    });
  };

  const handleLabelSizeChange = (event) => {
    setLabelSize(event.target.value);
  };

  const handleNodeSizeChange = (event) => {
    setNodeSizeMultiplier(event.target.value);
  };

  const handleColorChange = (color) => {
    setShapeColor(color.hex);
  };

  const plotData = data.map(item => ({
    type: 'scatter',
    mode: 'markers+text',
    text: item.Label,
    textposition: 'top center',
    textfont: { size: labelSize }, // Yazı boyutunu ayarla
    x: [parseFloat(item.X)],
    y: [parseFloat(item.Y)],
    marker: {
      size: parseFloat(item.Size) * 10 * nodeSizeMultiplier, // Node boyutunu çarpan ile ayarla
      color: item.Color,
    },
  }));

  const layout = {
    //title: 'Interaktif Bubble Chart',
    showlegend: false,
    xaxis: {
      range: [0, 1],
      title: 'X Axis',
      color:'white',
    },
    yaxis: {
      range: [0, 1],
      title: 'Y Axis',
      color:'white',
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
    plot_bgcolor: 'black',
    shapes: shapes, // Çizimleri ekle
    dragmode: dragMode, // Seçili çizim modunu ekle
    newshape: {
      line: {
        color: shapeColor, // Seçilen rengi kullan
        width: 2,
      },
    },
  };

  const handleRelayout = (event) => {
    if (event['shapes']) {
      const newShapes = event['shapes'];
      setShapes(newShapes);
      setShapeHistory([...shapeHistory, newShapes]);
    }
    if (event['dragmode']) {
      setDragMode(event['dragmode']);
    }
  };

  const undoLastShape = () => {
    if (shapeHistory.length > 0) {
      const newShapeHistory = shapeHistory.slice(0, -1);
      setShapes(newShapeHistory[newShapeHistory.length - 1] || []);
      setShapeHistory(newShapeHistory);
    }
  };

  return (
    <div className={styles.container}>
      
      <h1>DIVISION !!</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={() => handleEndpointClick('')}>Button 1</button>
        <button className={styles.button} onClick={() => handleEndpointClick('/buttontwo')}>Button 2</button>
        <button className={styles.button} onClick={() => handleEndpointClick('/buttonthree')}>Button 3</button>
      </div>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={handleMoreClick}>More</button>
      </div>
      <div className={styles.sliderContainer}>
        <label>
          Label Size:
          <input
            type="range"
            min="8"
            max="24"
            value={labelSize}
            onChange={handleLabelSizeChange}
            className={styles.slider}
          />
        </label>
      </div>
      <div className={styles.sliderContainer}>
        <label>
          Node Size:
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={nodeSizeMultiplier}
            onChange={handleNodeSizeChange}
            className={styles.slider}
          />
        </label>
      </div>
      <div className={styles.colorPickerContainer}>
        <label>Shape Color:</label>
        <SketchPicker color={shapeColor} onChangeComplete={handleColorChange} />
      </div>
      <div className={styles.plotContainer}>
        <Plot
          data={plotData}
          layout={layout}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
            modeBarButtonsToAdd: ['drawline', 'drawopenpath', 'drawcircle', 'drawrect'],
            modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toggleSpikelines'], // Pan dışındaki seçenekler kaldır
          }}
          onRelayout={handleRelayout}
        />
      </div>
    </div>
  );
};

export default MapPage;