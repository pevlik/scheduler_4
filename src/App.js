import React from "react";
import Scheduler from "./scheduler";

import '@mobiscroll/react/dist/css/mobiscroll.min.css';
import '@mobiscroll/print/dist/css/mobiscroll.min.css';
import './App.css';

function App() {
    return (
        <div className="App">
            <Scheduler />
        </div>
    );
}

export default App;
