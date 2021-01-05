import { transformSync } from '@babel/core';
import babelPlugin from '../../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    plugins: [babelPlugin],
  })?.code;
};

describe('class names string literal', () => {
  it('should move suffix of interpolation into inline styles', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';
        import { fontSize } from './nah';

        const ListItem = () => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`font-size: \${fontSize}px;\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([
      'font-size:var(--_1j2e0s2)',
      'style={{"--_1j2e0s2":ix(fontSize,"px")}}',
    ]);
  });

  it('should transform no template string literal', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: 20px\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toMatchInlineSnapshot(`
      "/* File generated by @compiled/babel-plugin v0.0.0 */import*as React from'react';import{ax,ix,CC,CS}from\\"@compiled/react/runtime\\";const _=\\"._1wybgktf{font-size:20px}\\";const ListItem=()=><CC>
          <CS>{[_]}</CS>
          {<div className={\\"_1wybgktf\\"}>hello, world!</div>}
        </CC>;"
    `);
  });

  it('should transform template string literal with string variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const fontSize = '12px';

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(`{font-size:12px}`);
  });

  it('should transform template string literal with numeric variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const fontSize = 12;

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`font-size: \${fontSize};\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(`{font-size:12}`);
  });

  it('should transform template string literal with obj variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = { color: 'blue' };

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(`{color:blue}`);
  });

  it('should transform template string with no argument arrow function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color = () => ({ color: 'blue' });

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(`{color:blue}`);
  });

  it('should transform template string with no argument function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        function color() { return { color: 'blue' }; }

        const ListItem = () => (
          <ClassNames>
            {({ css }) => <div className={css\`\${color()}\`}>hello, world!</div>}
          </ClassNames>
        );
      `);

    expect(actual).toInclude(`{color:blue}`);
  });

  it('should transform template string with argument arrow function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const color1 = 'black';
        const mixin = ({ color1, color2: c }, color3, radius) => ({
          color: color1,
          backgroundColor: c,
          borderColor: color3 ,
          borderRadius: radius,
        });

        const color = { red: 'red' };
        const greenColor = 'green';

        const Component = (props) => {
          const color2 = 'black';

          return (
            <ClassNames>
              {({ css }) => <div className={css\`\${mixin({ color1: color.red, color2: 'blue' }, greenColor, 10)}\`} />}
            </ClassNames>
          );
        };
    `);

    expect(actual).toIncludeMultiple([
      '{color:red}',
      '{background-color:blue}',
      '{border-color:green}',
      '{border-radius:10px}',
    ]);
  });

  it('should transform template string with unresolved argument arrow function variable', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const radius = 10;
        const mixin = (color1, radius, size, weight) => ({
          color: color1,
          borderRadius: radius,
          fontSize: size,
          fontWeight: weight
        });

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`\${mixin(props.color1, radius)}\`} />}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([
      '{color:var(--_zo7lop)}',
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{font-weight:var(--_u6vle4)}',
      '"--_u6vle4":ix()',
      '{font-size:var(--_kre2x8)}',
      '"--_kre2x8":ix()',
    ]);
  });

  it('should transform template string with argument arrow function variable inside member expression', () => {
    const actual = transform(`
        import { ClassNames } from '@compiled/react';

        const mixin = {
          value: (color1, r, color2) => ({
            color: color1,
            borderRadius: r,
            borderColor: color2
          })
        }

        const radius = 10;

        const Component = (props) => (
          <ClassNames>
            {({ css, style }) => <div style={style} className={css\`\${mixin.value(props.color1, radius, 'red')}\`} />}
          </ClassNames>
        );
      `);

    expect(actual).toIncludeMultiple([
      '"--_zo7lop":ix(props.color1)',
      '{border-radius:10px}',
      '{border-color:red}',
    ]);
  });
});
