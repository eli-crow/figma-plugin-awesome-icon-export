import React from 'react'
import * as ReactDOM from 'react-dom'
import "./ui.css";
import App from './App'

window.addEventListener('DOMContentLoaded', () => {
    ReactDOM.render(<App />, document.getElementById('react-app'))
})