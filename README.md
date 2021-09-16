# @reef-defi/react-lib

> Reef React Library

[![NPM](https://img.shields.io/npm/v/@reef-defi/react-lib.svg)](https://www.npmjs.com/package/@reef-defi/react-lib) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
yarn add @reef-defi/react-lib
```

## Usage

```tsx
import React, { Component } from 'react'

import { Components } from '@reef-defi/react-lib'
import '@reef-defi/react-lib/dist/index.css'

const { Card, Button } = Components;

const Example = (): JSX.Element => (
  <Card.Card>
    <Card.Header>
      <Card.Title>Hello from the other side!</Card.Title>
      <Button.Back onClick={() => {}} />
    </Card.Header>
  </Card.Card>
)
```

## License

MIT © [Frenkiee](https://github.com/Frenkiee)
