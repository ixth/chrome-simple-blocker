'use strict';

const { store, validate } = chrome.extension.getBackgroundPage();

const form = document.querySelector('#settings');
const submit = form.querySelector('[type="submit"]');

const onChange = ({ mode, rules }) => {
    if (rules) {
        form.elements.rules.value = rules.join('\n');
    }
    if (mode) {
        form.elements.mode.value = mode;
    }
};

store.init().then(onChange);
store.onChange(onChange);

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nextStore = {
        rules: form.elements.rules.value.split(/\r|\n/g),
        mode: form.elements.mode.value,
    };

    const errors = validate(nextStore);

    if (errors.length) {
        errors.forEach((e) => console.error(e));
        return;
    }

    store.set(nextStore);
    submit.disabled = true;
});

const addEventListener = (type, listener) => {
    type.split(' ').forEach((type) => {
        form.addEventListener(type.trim(), listener);
    });
};

addEventListener('input change', () => {
    submit.disabled = false;
});
