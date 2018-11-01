const mix = require('laravel-mix');
const path = require('path');
const FileSet = require('file-set')

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

        this.vendor = vendor;
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
        this.getModules().forEach(file => {
            let module = require(file);
            let resourcesPath = this.getResourcesPath(file);

            vendors = vendors.concat(module.vendors)

            Object.keys(module.entries).forEach(source => {
                let entry = module.entries[source]
                let extension = this.getExtension(source)
                if (extension === 'js') {
                    mix.js(`${resourcesPath}/js/${source}`, `${Config.publicPath}/js/${this.options.modulesPath}/${entry}`)
                } else if (extension === 'scss') {
                    mix.sass(`${resourcesPath}/sass/${source}`, `${Config.publicPath}/css/${this.options.modulesPath}/${entry}`)
                }
            })
        });

        if (this.options.extract && vendors.length > 0) {
            mix.extract(vendors.filter((value, index, self) => {
                return self.indexOf(value) === index;
            }));
        }
    }

    getModuleName(file) {
        let directory = path.dirname(file)
        let base = new String(directory).substring(directory.lastIndexOf('/') + 1);
        if (base.lastIndexOf(".") !== -1) {
            base = base.substring(0, base.lastIndexOf("."))
        }
        return base;
    }

    getExtension(filename) {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i + 1);
    }

    getResourcesPath(file) {
        return path.dirname(file) + '/' + this.options.resourcesDirectory;
    }

    getModules() {
        let modulesPath = rootPath(`${this.options.path}/${this.vendor}/**/*/${this.options.entryFile}`);
        let modules = new FileSet(modulesPath);

        return modules.files;
    }

    webpackConfig(config) {
        this.getModules().forEach(file => {
            config.resolve.alias[this.getModuleName(file)] = this.getResourcesPath(file) + '/js'
        })

        config.resolve.symlinks = false
    }
}

mix.extend('modular', new ModularMix());
