import { App, Plugin, WorkspaceLeaf, ItemView } from 'obsidian';

interface Angles {
	hourHand: number;
	minuteHand: number;
	secondHand: number;
}

const currentAngles: Angles = {
	hourHand: 0,
	minuteHand: 0,
	secondHand: 0
};

type AngleKey = keyof Angles;

class AnalogueClockView extends ItemView {
	private clockInterval: number | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return 'analogue-clock';
	}

	getDisplayText() {
		return 'Analogue Clock';
	}


	initClockDisplay() {
		// First update without animation
		document.querySelectorAll('.hand').forEach(el => (el as HTMLElement).style.transition = "none");
		this.updateClock(true);  // Pass `true` to reinitialize angles
		setTimeout(() => {
			document.querySelectorAll('.hand').forEach(el => (el as HTMLElement).style.transition = "");
		}, 50);
	}
	
	// Called when the view is closed
	async onClose(): Promise<void> {
		if (this.clockInterval !== null) {
			window.clearInterval(this.clockInterval);
			this.clockInterval = null;
		}
	}
	
	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		const div = document.createElement('div');
		div.innerHTML = `
			<div id="clockface">
				<svg xmlns="http://www.w3.org/2000/svg" style="background-color: transparent" width="100%" height="100%"
				viewBox="0 0 200 200">
				<!-- Clock face -->
				<circle cx="100" cy="100" r="98" style="fill: rgb(179, 179, 179); stroke: black; stroke-width: 3.0" />
				<circle cx="100" cy="100" r="70" style="fill: black; stroke: black; stroke-width: 3.0" />
				
				<!-- Clock hands -->
				<g transform="translate(100, 100)">
					<g id="hourHand" class="hand">
					<line x1="0" y1="0" x2="0" y2="-52" style="stroke: white; stroke-width: 5" />
					</g>
				</g>
		
				<g transform="translate(100, 100)">
					<g id="minuteHand" class="hand">
					<line x1="0" y1="0" x2="0" y2="-67" style="stroke: white; stroke-width: 3" />
					</g>
				</g>
		
				<g transform="translate(100, 100)">
					<g id="secondHand" class="hand">
					<line x1="0" y1="0" x2="0" y2="-93" style="stroke: rgb(255, 140, 0); stroke-width: 2" />
					</g>
				</g>
		
				<!-- Center cap -->
				<circle cx="100" cy="100" r="4" style="fill: black; stroke: white; stroke-width: 2.0" />
				</svg>
			</div>

			<style>
				body {
				overflow: hidden;
				min-height: 100%;
				margin: 0;
				background-color: var(--vscode-editor-background);
				}
		
				html {
				height: 100%;
				background: transparent;
				}
		
				#clockface {
				height: 96vh;
				width: 96vw;
				}
		
				/* Train station clock bounce effect */
				.hand {
				/* Fast start, slow end with slight bounce */
				transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.2);
				}
				
				#secondHand {
				/* Faster transition for second hand but same bounce effect */
				transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2);
				}
			</style>
		`;
		container.appendChild(div);

		this.initClockDisplay(); // Initialize the clock display setup
		this.clockInterval = window.setInterval(this.updateClock.bind(this), 1000);
	}

	updateHand(id: AngleKey, targetAngle: number) {
		const hand = document.getElementById(id);
		if (!hand) return;
		
		// Calculate the shortest path to the new angle
		let currentAngle = currentAngles[id];
		let angleDiff = targetAngle - (currentAngle % 360);
		
		// Adjust for crossing the 0/360 boundary
		if (angleDiff > 180) angleDiff -= 360;
		if (angleDiff < -180) angleDiff += 360;
		
		// Calculate the new absolute angle (keeps increasing)
		const newAngle = currentAngle + angleDiff;
		currentAngles[id] = newAngle;
		
		// Apply the rotation
		hand.setAttribute("transform", `rotate(${newAngle})`);
	}

	updateClock(reinitialize = false) {
		const now = new Date();
		const hours = now.getHours();
		const minutes = now.getMinutes();
		const seconds = now.getSeconds();
		
		// Calculate target angles
		const targetHourAngle = (hours % 12) * 30 + minutes * 0.5;
		const targetMinAngle = minutes * 6;
		const targetSecAngle = seconds * 6;
	
		if (reinitialize) {
			currentAngles.hourHand = targetHourAngle;
			currentAngles.minuteHand = targetMinAngle;
			currentAngles.secondHand = targetSecAngle;
		}
		
		// Update each hand with continuous rotation
		this.updateHand('hourHand', targetHourAngle);
		this.updateHand('minuteHand', targetMinAngle);
		this.updateHand('secondHand', targetSecAngle);
	}
}

export default class AnalogueClockPlugin extends Plugin {
	async onload() {
		this.registerView(
			'analogue-clock',
			(leaf) => new AnalogueClockView(leaf)
		);

		this.addRibbonIcon('clock', 'Open Analogue Clock', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-analogue-clock',
			name: 'Open Analogue Clock',
			callback: () => this.activateView(),
		});
	}

	onunload() {
		this.app.workspace.detachLeavesOfType('analogue-clock');
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType('analogue-clock');

		await this.app.workspace.getLeaf(true).setViewState({
			type: 'analogue-clock',
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType('analogue-clock')[0]
		);
	}
}