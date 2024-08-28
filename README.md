# 3D Smart Home UI Demonstration

https://github.com/user-attachments/assets/e725bd34-2422-4561-a7e4-b86a6b0fae05

## Disclaimer
This project was never intended to be used outside of my own smart home system. As a result, many smart home entities are hardcoded. I made it public solely as a proof of concept.

## About the Project
This is a simple proof of concept for a 3D smart home user interface. It is not fully functional without the appropriate models and textures. The project is written in plain JavaScript and Three.js, without using a framework like React. It connects to a smart home network via an API. The smart home software in use is Home Assistant, a free and open-source home automation software.

## Functionality
- **Currently Controllable Elements:**
  - **Lights:** Light switches control the connected lamps. The current status is displayed in real-time (e.g., light bulbs glow when the associated light entity is turned on).
  - **Shutters:** Control and display the current state of shutters.
  
- **Navigation:**
  - The UI allows navigation through different floors with button presses, accompanied by smooth animations.
  
- **Detailed Room View:**
  - Clicking on a room opens a detailed view of that room, allowing for targeted controls.

## License
This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute the code.

## Acknowledgements
- [Three.js](https://threejs.org/) for the 3D graphics library
- [Home Assistant](https://www.home-assistant.io/) for the home automation software
