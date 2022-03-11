# coc-vimtex

Tex completion source for [vimtex](https://github.com/lervag/vimtex).

You may need configure `coc.sources.vimtex.filetypes` when you have vimtex lazy
loaded for specific filetypes.

**Note** iletype `tex` is mapped to `latex` with coc.nvim.

## Install

In your vim/neovim, run command:

```
:CocInstall coc-vimtex
```

Or add this plugin's folder to your vim's runtimepath.

## Options

- `coc.source.vimtex.disableSyntaxes` disabled syntax names.
- `coc.source.vimtex.enable` set to false to disable this source.
- `coc.source.vimtex.priority` priority of source, default `99`.
- `coc.source.vimtex.filetypes` Filetypes to enable this source for. Defaults to `['tex', 'plaintex', 'latex']`. Useful for when you want to enable vimtex completions for markdown/pandoc files

## License

MIT
