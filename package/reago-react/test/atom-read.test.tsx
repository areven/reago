// =============================================================================
// Atom read tests
// =============================================================================

import {useLayoutEffect, useState} from 'react';
import {atomAction, atomState, createStore, dispatch, invalidate, read} from 'reago';
import {StoreProvider, useReadAtom} from 'reago-react';
import {expect, test} from 'vitest';
import {render} from 'vitest-browser-react';


test('useReadAtom() reads the value of a functional atom as is', async () => {
  function $atom() {
    return 123;
  }

  function Component() {
    const value = useReadAtom($atom);
    return <div title='result'>{value}</div>;
  }

  const screen = render(<Component/>);
  const result = screen.getByTitle('result');

  await expect.element(result).toHaveTextContent('123');
});

test('useReadAtom() returns promises returned from functional atoms as is', async () => {
  let renderCount = 0;
  let value;

  function $atom(instance: number) {
    return Promise.resolve('hello world ' + instance);
  }

  function Component() {
    ++renderCount;
    value = useReadAtom($atom, 42);
    return <div data-testid='test'>loaded</div>;
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('loaded');
  expect(value).toBeInstanceOf(Promise);
  await expect(value).resolves.toBe('hello world 42');
  expect(renderCount).toBeLessThanOrEqual(1);
});

test('useReadAtom() rerenders on changes of a functional atom', async () => {
  let renderCount = 0;

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom)(42);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBe(2);

  invalidate($atom);
  await expect.element(element).toHaveTextContent('42');
  expect(renderCount).toBe(2);

  dispatch($atom)(89);
  await expect.element(element).toHaveTextContent('89');
  expect(renderCount).toBe(3);
});

test('useReadAtom() returns promises from generative atoms as is', async () => {
  let renderCount = 0;
  let value;

  function* $atom() {
    yield Promise.resolve(null);
    return 'made it!';
  }

  function Component() {
    ++renderCount;
    value = useReadAtom($atom);
    return <div data-testid='test'>loaded</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('loaded');
  expect(value).toBeInstanceOf(Promise);
  await expect(value).resolves.toBe('made it!');
  expect(renderCount).toBeLessThanOrEqual(1);
});

test('useReadAtom() rerenders on changes of a generative atom', async () => {
  let renderCount = 0;

  function* $atom() {
    yield Promise.resolve(null);
    const [value, setValue] = atomState(0);
    yield Promise.resolve(true);
    atomAction(setValue, []);
    yield Promise.resolve(false);
    return value;
  }

  function Component() {
    ++renderCount;
    useReadAtom($atom);
    return <div data-testid='test'>{renderCount}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('1');
  expect(renderCount).toBe(1);

  dispatch($atom)(42);
  await expect.element(element).toHaveTextContent('2');
  expect(renderCount).toBe(2);

  invalidate($atom);
  await read($atom);
  await expect.element(element).toHaveTextContent('3');
  expect(renderCount).toBe(3);
});

test('useReadAtom() does not rerender if atom is recomputed but its value remains the same', async () => {
  let renderCount = 0;

  function $atom() {
    const [value1, setValue1] = atomState(0);
    const [value2, setValue2] = atomState(0);
    atomAction((n1: number, n2: number) => {
      setValue1(n1);
      setValue2(n2);
    }, []);
    return value1 + value2;
  }

  function Component() {
    ++renderCount;
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const element = screen.getByTestId('test');

  await expect.element(element).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom)(5, 3);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);

  dispatch($atom)(4, 4);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);

  invalidate($atom);
  await expect.element(element).toHaveTextContent('8');
  expect(renderCount).toBe(2);
});

test('useReadAtom() supports atom families', async () => {
  let renderCount = 0;

  function $atom(instance: string) {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const value1 = useReadAtom($atom, 'first');
    const value2 = useReadAtom($atom, 'second');
    return (
      <>
        <div data-testid={'test-1'}>{value1}</div>
        <div data-testid={'test-2'}>{value2}</div>
      </>
    );
  }

  const screen = render(<Component/>);
  const test1 = screen.getByTestId('test-1');
  const test2 = screen.getByTestId('test-2');

  await expect.element(test1).toHaveTextContent('0');
  await expect.element(test2).toHaveTextContent('0');
  expect(renderCount).toBe(1);

  dispatch($atom, 'first')(42);
  dispatch($atom, 'second')(89);

  await expect.element(test1).toHaveTextContent('42');
  await expect.element(test2).toHaveTextContent('89');
  expect(renderCount).toBe(2);

  dispatch($atom, 'third')(124334);

  await expect.element(test1).toHaveTextContent('42');
  await expect.element(test2).toHaveTextContent('89');
  expect(renderCount).toBe(2);
});

test('useReadAtom() can switch from one store to another', async () => {
  const store1 = createStore();
  const store2 = createStore();

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  store1.dispatch($atom)(42);
  store2.dispatch($atom)(84);

  function Component1() {
    const [firstStore, setFirstStore] = useState(true);
    return (
      <StoreProvider store={firstStore ? store1 : store2}>
        <Component2/>
        <button onClick={() => setFirstStore(false)}>toggle store</button>
      </StoreProvider>
    );
  }

  function Component2() {
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component1/>);
  const test = screen.getByTestId('test');
  const button = screen.getByRole('button');

  await expect.element(test).toBeInTheDocument();
  await expect.element(button).toBeInTheDocument();

  await expect.element(test).toHaveTextContent('42');
  await button.click();
  await expect.element(test).toHaveTextContent('84');
});

test('useReadAtom() can switch from one atom to another', async () => {
  let renderCount = 0;

  function $atom1() {
    return 123;
  }

  function $atom2() {
    return 456;
  }

  function Component1() {
    ++renderCount;
    const [firstAtom, setFirstAtom] = useState(true);
    const value = useReadAtom(firstAtom ? $atom1 : $atom2);
    return (
      <>
        <div data-testid='test'>{value}</div>
        <button onClick={() => setFirstAtom(false)}>toggle atom</button>
      </>
    );
  }

  const screen = render(<Component1/>);
  const test = screen.getByTestId('test');
  const button = screen.getByRole('button');

  await expect.element(test).toBeInTheDocument();
  await expect.element(button).toBeInTheDocument();

  await expect.element(test).toHaveTextContent('123');
  await button.click();
  await expect.element(test).toHaveTextContent('456');
});

test('useReadAtom() preserves the original result reference', async () => {
  const result = {x: 123};
  const $atom = () => result;

  let returnedResult;
  function Component() {
    returnedResult = useReadAtom($atom);
    return null;
  }

  render(<Component/>);
  expect(returnedResult).toBe(result);
});

test('useReadAtom() reports correct value if it changed between first read() and the watch() call', async () => {
  let renderCount = 0;

  function $atom() {
    const [value, setValue] = atomState(10);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    useLayoutEffect(() => {
      // mess up the value before useReadAtom can call watch()
      dispatch($atom)(404);
    });
    const value = useReadAtom($atom);
    return <div data-testid='test'>{value}</div>;
  }

  const screen = render(<Component/>);
  const test = screen.getByTestId('test');

  await expect.element(test).toHaveTextContent('404');
  expect(renderCount).toBe(2);
});
