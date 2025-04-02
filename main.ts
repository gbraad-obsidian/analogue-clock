import { App, Plugin, WorkspaceLeaf, ItemView } from 'obsidian';

class AnalogueClockView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return 'analogue-clock';
	}

	getDisplayText() {
		return 'Analogue Clock';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		const div = document.createElement('div');
		div.innerHTML = `
			<div class="clock-container">
				<div class="clock">
					<svg xmlns="http://www.w3.org/2000/svg"
						version="1.1"
						baseProfile="full"
						width="100%" 
						height="100%" 
						viewBox="0 0 200 200">
					<g id="faceplate">
						<circle id="faceplateCircle" cx="100" cy="100" r="98" style="fill: rgb(179, 179, 179); stroke: black; stroke-width: 3.0"/>
					</g>
					
					<g id="faceplate">
						<circle id="faceplateInnerCircle" cx="100" cy="100" r="70" style="fill: black; stroke: black; stroke-width: 3.0"/>
					</g>

					<g id="hourHand">
					<line x1="100" y1="100" x2="100" y2="48" style="stroke: white; stroke-width: 5" />
					</g>

					<g id="minuteHand">
						<line x1="100" y1="100" x2="100" y2="33" style="stroke: white; stroke-width: 3" />
					</g>

					<g id="secondHand">
						<line x1="100" y1="100" x2="100" y2="7" style="stroke: rgb(255, 140, 0); stroke-width: 2" />
					</g>

					<g id="axisCover">
						<circle id="axisCoverCircle" cx="100" cy="100" r="4" style="fill: black; stroke: white; stroke-width: 2.0"/>
					</g>
					</svg>
				</div>
			</div>

			<style>
				.clock-container {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 100%;
					height: 100%;
				}

				.clock {
					width: 300px;
					height: 300px;
				}

				.clock-face {
					stroke: var(--text-normal);
					fill: none;
				}

				.clock-hand {
					stroke: var(--text-normal);
					stroke-linecap: round;
				}
			</style>
		`;
		container.appendChild(div);

		function updateClock() {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const seconds = now.getSeconds();
			const millis = now.getMilliseconds();

			rotate('hourHand', hours * 30 + minutes * 0.5);
			rotate('minuteHand', minutes * 6);
			rotate('secondHand', seconds * 6 + (6 * millis / 1000));
		}

		function rotate(id: string, angle: number) {
			const element = div.querySelector(`#${id}`);
			if (element) {
				element.setAttribute('transform', `rotate(${angle}, 100, 100)`);
			}
		}

		updateClock();
		setInterval(updateClock, 1000);
	}

	async onClose() {
		// Nothing to clean up.
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