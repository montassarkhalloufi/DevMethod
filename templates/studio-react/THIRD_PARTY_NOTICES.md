# Third-party component

`src/shared/ui/button.tsx` adapts the official shadcn/ui Button. Source inspected on
2026-09-16: [new-york-v4 Button](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx).
The upstream [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md) is reproduced below.
Local changes: explicit TypeScript props, local `cn` import, the focused
`@radix-ui/react-slot` package instead of the aggregate `radix-ui` import, and formatting.
The primitive retains real button/link composition, variants, focus and disabled behavior.
This template includes that one component; it does not install or claim the complete shadcn catalogue.
The package manifest lists the separately licensed runtime dependencies.

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
