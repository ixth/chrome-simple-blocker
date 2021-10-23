const MODES = {
    BLACKLIST: 'BLACKLIST',
    WHITELIST: 'WHITELIST',
};

const CachedStorage = (namespace, initial) => {
    let cache = initial;

    const init = () =>
        new Promise((resolve) => {
            browser.storage.local.get(
                {
                    [namespace]: initial,
                },
                (storage) => {
                    cache = {
                        ...cache,
                        ...storage[namespace],
                    };
                    resolve(cache);
                }
            )
        });

    const get = () => cache;

    const set = (data) =>
        new Promise((resolve) => {
            browser.storage.local.set(
                {
                    [namespace]: {
                        ...cache,
                        ...data,
                    }
                },
                resolve
            );
        });

    const onChange = (listener) =>
            browser.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'local' || !changes[namespace]) {
                return;
            }
            listener(changes[namespace].newValue);
        });

    onChange((changes) => {
        cache = {
            ...cache,
            ...changes,
        };
    });

    return {
        init,
        get,
        set,
        onChange,
    };
};

const store = CachedStorage('simpleBlocker', {
    mode: MODES.BLACKLIST,
    rules: [],
});

const validators = {
    mode: (mode) =>
        Object.values(MODES).includes(mode)
            ? []
            : [ new Error(`${mode} is invalid mode value`) ],

    rules: (rules) =>
        rules.reduce((errors, rule) => {
            try {
                new RegExp(rule);
                return errors;
            } catch (e) {
                return [ ...errors, e ];
            }
        }, [])
};

const validate = (data) =>
    Object.entries(data).reduce((errors, [key, value]) => ([ ...errors, ...validators[key](value) ]), []);


const filter = ({ url }) => {
    const { rules, mode } = store.get();
    const compiledRules = rules
        .filter((rule) => rule.trim())
        .map((rule) => new RegExp(rule));
    const matches = compiledRules.some((rule) => rule.test(url));
    return {
        cancel: mode === MODES.WHITELIST ? !matches : matches,
    };
};

store.init().then(
    () => {
        browser.webRequest.onBeforeRequest.addListener(
            filter,
            { urls: ['<all_urls>'] },
            ['blocking']
        );
    },
    (e) => {
        console.error(e)
    }
);

Object.assign(window, { store, validate });
