// The gamepad basically taps into the mouse and keyboard code to emulate moving and using them.
// This gamepad code assumes that the player uses modern controllers.
const gamepad = {
	gamepadConnected: false,
	usePointerAcceleration: true,
	acceleration: 0,
    nextGunToggled: true,
    previousGunToggled: true,
    previousGunToggled: false,
	// Google Chrome has a weird (perhaps intended bug?) where storing the state of a gamepad object
	// will cease updating it. Hence a new reference must be gathered every single tick.
	getGamepad: () => navigator.getGamepads()[0],
	// A loop that runs until the player started the game and the regular gamepad loop is called.
	waitForStart() {
		const gamepadRef = gamepad.getGamepad()
		// start key pressed
		if (gamepadRef.buttons[0].pressed) {
			simulation.startGame()
		}
		if (gamepad.gamepadConnected && simulation.onTitlePage) {
			requestAnimationFrame(gamepad.waitForStart)
		}
	},
	move(movement, buttons) {
		const THRESHOLD = 0.5
		// horizontal
		if (movement.x > THRESHOLD) {
			input.right = true
		} else if (movement.x < -THRESHOLD) {
			input.left = true
		} else {
			input.right = input.left = false
		}
		// sneak using button B, aka index 0
		input.down = buttons[0]
		// jump using button Y, aka index 2
		input.up = buttons[2]
	},
	aim(aim) {
		const THRESHOLD = 0.1
		const VELOCITY = 15
        const MAX_SPEED = 10

		// const center = Vector.create(canvas.width / 2, canvas.height / 2)
		// const direction = Vector.sub(center, simulation.mouse)
		// // don't move if the distance is too small, otherwise this causes jittering
		// if (Vector.magnitudeSquared(direction) > 1000) {
		//     simulation.mouse = Vector.add(simulation.mouse, Vector.mult(Vector.normalise(direction), VELOCITY / 4))
		// }
		// if the player isn't aiming, stop all acceleration
		if (this.usePointerAcceleration && Math.abs(aim.x) - THRESHOLD < 0 && Math.abs(aim.y) - THRESHOLD) {
			this.acceleration = 0
		} else {
			if (this.usePointerAcceleration) {
				this.acceleration = Math.min(this.acceleration + 1, MAX_SPEED)
			}
			const velocityFactor = (VELOCITY * this.acceleration) / 10
			simulation.mouse.x = Math.max(0, Math.min(canvas.width, simulation.mouse.x + aim.x * velocityFactor))
			simulation.mouse.y = Math.max(0, Math.min(canvas.height, simulation.mouse.y + aim.y * velocityFactor))
		}
	},
	shoot(buttons) {
		// field: back left (aka index 6) or X (aka index 1)
		// gun: back right (aka index 7) or A (aka index 3)
		input.field = buttons[6] || buttons[1]
		input.fire = buttons[7] || buttons[3]
        // switch guns:
        // previous: front left (aka index 4)
        // next: front right (aka index 5)
        // this code prevents repeated runs when the key is held down.
        if (buttons[4] && this.nextGunToggled) {
            simulation.previousGun()
            this.nextGunToggled = false
        } else if (!buttons[4]) {
            this.nextGunToggled = true
        }
        if (buttons[5] && this.previousGunToggled) {
            simulation.nextGun()
            this.previousGunToggled = false
        } else if (!buttons[5]) {
            this.previousGunToggled = true
        }
	},
	gamepadLoop() {
		if (!this.gamepadConnected) return
		const gamepadRef = gamepad.getGamepad()
		// handle the axes. The left axes is used for movement, the right one for aiming.
		const movement = Vector.create(gamepadRef.axes[0], gamepadRef.axes[1])
		const aim = Vector.create(gamepadRef.axes[2], gamepadRef.axes[3])
		const buttons = gamepadRef.buttons.map(it => it.pressed)
		this.aim(aim)
		this.move(movement, buttons)
		this.shoot(buttons)
	}
}

const gamepadStatus = document.getElementById('gamepad-status')
const gamepadDisconnectedMessage =
	'No <strong>gamepad</strong> was detected!<br>If you wish to connect a gamepad, pair it with your computer and <strong>press any key.</strong></strong>'
const gamepadConnectedMessage = "<span class='color-gun'>Gamepad connected!</span>"

window.addEventListener('gamepadconnected', e => {
	if (gamepad.gamepadConnected) {
		console.warn('Two or more controllers were connected, this may lead to a weird behavior.')
	}
	console.log(`Controller connected with index ${e.gamepad.index} and id "${e.gamepad.id}"`)
	gamepad.gamepadConnected = true
	gamepadStatus.innerHTML = gamepadConnectedMessage
	if (simulation.onTitlePage) {
		// schedule a loop that'll start the game by pressing the B key
		requestAnimationFrame(gamepad.waitForStart)
	}
})

window.addEventListener('gamepaddisconnected', e => {
	console.log(`Controller with index ${e.gamepad.index} and id "${e.gamepad.id}" was disconnected`)
	gamepad.gamepadConnected = false
	gamepadStatus.innerHTML = gamepadDisconnectedMessage
})

// Initialize status
gamepadStatus.innerHTML = gamepadDisconnectedMessage
