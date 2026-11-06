# Make a state model explorable

Use a single self-contained HTML file when the question concerns business rules, state transitions, or data shape. A domain expert should be able to open the file, press buttons, and recognize a case the model cannot represent. For a visual direction, use [UI.md](UI.md).

At the top of the demo, state the model and question in a visible paragraph. For example, “Can an order be canceled after one parcel ships?” tells the reader which sequence to explore and what outcome would challenge the model.

## Separate the decision from its controls

Put the logic in a small portable module inside the script block. Let the page call its interface and render the result. Choose the shape that matches the question:

- A pure `(state, action) => state` reducer for discrete events over a current value.
- Explicit states and transitions when legal actions are the decision under examination.
- Pure functions over a plain data shape for transformations without an implicit current state.
- A class or module with a small method interface when it owns ongoing state.

Keep DOM updates outside that logic. Its design can inform implementation, but prototype code still needs review against production requirements before reuse.

## Show what each action changes

Deliver one file with inline HTML, CSS, and JavaScript, with no framework, bundler, or server. It must run by opening it and remain shareable as a file. Use domain language in buttons and state labels so a non-developer can judge the behavior.

Arrange the page around exploration:

1. Give the title and a one-line explanation of the question.
2. Show the full relevant state as labeled fields, updating after each action. Avoid making the reader interpret raw JSON; highlight a change when that helps.
3. Provide a free-play button for every action, available to attempt in any order. An illegal action should expose the model's response rather than disappear from the experiment.
4. Put guided scenarios in tabs. Each states its initial situation and what to watch, then supplies ordered action buttons that advance one step. Starting a scenario resets its state.

Include a normal path, an awkward edge case, and an attempt that should be illegal. Keep clean typography, generous spacing, and one accent color. Avoid animation or decoration that competes with the state and actions.

Open or deliver the file with run instructions. Observe the scenarios and record what the model establishes and what remains uncertain. Add a new action or scenario when it resolves the actual question. Follow [SKILL.md](SKILL.md) for the boundary between the runnable experiment and production work; branch or issue archival belongs only to an authorized workflow.
