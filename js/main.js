// UI elements.
const deviceNameLabel = document.getElementById('device-name');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const terminalContainer = document.getElementById('terminal');
const sendForm = document.getElementById('send-form');
const inputField = document.getElementById('input');

// Helpers.
const defaultDeviceName = 'Terminal';
const terminalAutoScrollingLimit = terminalContainer.offsetHeight / 2;
let isTerminalAutoScrolling = true;

const scrollElement = (element) => {
  const scrollTop = element.scrollHeight - element.offsetHeight;

  if (scrollTop > 0) {
    element.scrollTop = scrollTop;
  }
};

const logToTerminal = (message, type = '') => {
  terminalContainer.insertAdjacentHTML('beforeend',
      `<div${type && ` class="${type}"`}>${message}</div>`);

  if (isTerminalAutoScrolling) {
    scrollElement(terminalContainer);
  }
};

// Obtain configured instance.
const terminal = new BluetoothTerminal();

// Override `receive` method to log incoming data to the terminal.
terminal.receive = function(data) {
  logToTerminal(data, 'in');
};

// Override default log method to output messages to the terminal and console.
terminal._log = function(...messages) {
  // We can't use `super._log()` here.
  messages.forEach((message) => {
    logToTerminal(message);
    console.log(message); // eslint-disable-line no-console
  });
};

// Implement own send function to log outcoming data to the terminal.
const send = (data) => {
  terminal.send(data).
      then(() => logToTerminal(data, 'out')).
      catch((error) => logToTerminal(error));
};

// Bind event listeners to the UI elements.
connectButton.addEventListener('click', () => {
  terminal.connect().
      then(() => {
        deviceNameLabel.textContent = terminal.getDeviceName() ?
            terminal.getDeviceName() : defaultDeviceName;
      });
});

is_mouse_down = false;
start_x = 0;
start_y = 0;

create_motorcommand = function(left, right){

  if(left > 255){
    left = 255;
  }
  if(left < -255){
    left = -255;
  }

  if(right > 255){
    right = 255;
  }
  if(right < -255){
    right = -255;
  }

  motor_command = "M";

  if(left < 0){
    motor_command += "-";
    left = -1 * left;
  } else {
    motor_command += "+";
  }

  if(left < 10){
    motor_command += "00";
  } else if(left < 100){
    motor_command += "0";
  }

  motor_command += left;

  motor_command += ",";

  if(right < 0){
    motor_command += "-";
    right = -1 * right;
  } else {
    motor_command += "+";
  }

  if(right < 10){
    motor_command += "00";
  } else if(right < 100){
    motor_command += "0";
  }

  motor_command += right;

  return motor_command;

}

terminalContainer.addEventListener('mousedown', (e) => {

  is_mouse_down = true;
  start_x = e.screenX;
  start_y = e.screenY;

  return;

});

terminalContainer.addEventListener('mouseup', () => {

  is_mouse_down = false;

  motor_command = create_motorcommand(0, 0);
  send(motor_command);

  return;

});

terminalContainer.addEventListener('mousemove', (e) => {

  if(is_mouse_down){

    dx = start_x - e.screenX;
    dy = start_y - e.screenY;

    left = Math.round( dy - ( dx / 10 ) );
    right = Math.round( dy + ( dx / 10 ) );

    motor_command = create_motorcommand(left, right);

    //console.log(motor_command);

    send(motor_command);

  }

  return;

});

disconnectButton.addEventListener('click', () => {
  terminal.disconnect();
  deviceNameLabel.textContent = defaultDeviceName;
});

sendForm.addEventListener('submit', (event) => {
  event.preventDefault();

  send(inputField.value);

  inputField.value = '';
  inputField.focus();
});

// Switch terminal auto scrolling if it scrolls out of bottom.
terminalContainer.addEventListener('scroll', () => {
  const scrollTopOffset = terminalContainer.scrollHeight -
      terminalContainer.offsetHeight - terminalAutoScrollingLimit;

  isTerminalAutoScrolling = (scrollTopOffset < terminalContainer.scrollTop);
});
