const mix = require('laravel-mix');
const path = require('path');

// This is kind of an undocumented Mix function, hope it stays around! Easy to
// refactor if it'd ever cause an issue.
const rootPath = Mix.paths.root.bind(Mix.paths);

class ModularMix {
    name() {
        return ['modular'];
    }

    dependencies() {
        this.requiresReload = true;

        return ['file-set'];
    }

    register(vendor, options = {}) {
        const FileSet = require('file-set')
        this.options = Object.assign(
            {
                extract: true,
                entryFile: 'module.js',
                resourcesDirectory: 'resources',
                modulesPath: 'modules',
                path: 'vendor',
            },
            options
        );

        let vendors = [];

        function getExtension(filename) {
            var i = filename.lastIndexOf('.');
            return (i < 0) ? '' : filename.substr(i + 1);
        }

        let modulesPath = rootPath(`${this.options.path}/${vendor}/**/*/${this.options.entryFile}`);

        let modules = new FileSet(modulesPath);
        modules.files.forEach(file => {
            let module = require(file);
            let resourcesPath = path.dirname(file) + '/' + this.options.resourcesDirectory;

            vendors = vendors.concat(module.vendors)

            Object.keys(module.entries).forEach(source => {
                let entry = module.entries[source]
                let extension = getExtension(source)
                if (extension === 'js') {
                    mix.js(`${resourcesPath}/js/${source}`, `${Config.publicPath}/js/${this.options.modulesPath}/${entry}`)
                } else if (extension === 'scss') {
                    mix.sass(`${resourcesPath}/sass/${source}`, `${Config.publicPath}/css/${this.options.modulesPath}/${entry}`)
                }
            })
        });

        if (this.options.extract) {
            mix.extract(vendors);
        }
    }

    webpackConfig(config) {
        config.resolve = {
            symlinks: false,
        }
    }
}

mix.extend('modular', new ModularMix());