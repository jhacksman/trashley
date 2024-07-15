# This script will handle UART communication with the ODrive using the ODrive Python package.
import odrive
from odrive.enums import *
import time
import serial

# Function to initialize ODrive and UART
def init_odrive_uart(port='/dev/ttyACM0', baud_rate=115200):
    try:
        # Initialize serial connection
        ser = serial.Serial(port, baud_rate, timeout=1)
        print(f"Serial connection established on {port} at {baud_rate} baud")

        # Find and connect to ODrive
        print("Looking for ODrive...")
        odrv = odrive.find_any(timeout=10)
        print("Found ODrive!")

        return odrv, ser
    except serial.SerialException as e:
        print(f"Error initializing UART: {str(e)}")
        return None, None
    except Exception as e:
        print(f"Error connecting to ODrive: {str(e)}")
        return None, None

# Function to send a command to ODrive
def send_command(ser, command):
    try:
        ser.write(command.encode() + b'\n')
        response = ser.readline().decode().strip()
        return response
    except Exception as e:
        print(f"Error sending command: {str(e)}")
        return None

# Function to read ODrive status
def read_status(odrv):
    try:
        axis = odrv.axis0
        return {
            "current_state": axis.current_state,
            "pos_estimate": axis.encoder.pos_estimate,
            "vel_estimate": axis.encoder.vel_estimate,
            "motor_temperature": axis.motor.get_temperature(),
        }
    except Exception as e:
        print(f"Error reading ODrive status: {str(e)}")
        return None

# Main execution
if __name__ == "__main__":
    odrv, ser = init_odrive_uart()
    if odrv and ser:
        try:
            # Example usage
            print("ODrive initialized. Sending test command...")
            response = send_command(ser, "w axis0.requested_state 8")  # AXIS_STATE_CLOSED_LOOP_CONTROL
            print(f"Response: {response}")

            time.sleep(2)  # Wait for 2 seconds

            status = read_status(odrv)
            if status:
                print("ODrive Status:")
                for key, value in status.items():
                    print(f"{key}: {value}")
        finally:
            ser.close()
            print("Serial connection closed.")
    else:
        print("Failed to initialize ODrive and UART.")