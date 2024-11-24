// =============================================================================
// Atom read deasync tests
// =============================================================================

import {useLayoutEffect, useState} from 'react';
import {atomAction, atomState, createStore, deasync, dispatch, invalidate, read} from 'reago';
import {StoreProvider, useReadDeasyncAtom} from 'reago-react';
import {expect, test} from 'vitest';
import {render} from 'vitest-browser-react';


test('useReadDeasyncAtom() immediately reads the value of a non-async functional atom', async () => {
  let renderCount = 0;

  function $atom() {
    return 123;
  }

  function Component() {
    ++renderCount;
    const unpacked = useReadDeasyncAtom($atom);
    if (unpacked.status !== 'resolved') throw new Error('fail');
    return <div title='result'>{unpacked.result}</div>;
  }

  const screen = render(<Component/>);
  const result = screen.getByTitle('result');

  await expect.element(result).toHaveTextContent('123');
});

test('useReadDeasyncAtom() unpacks resolved promises returned from functional atoms', async () => {
  let renderCount = 0;

  function $atom(instance: number) {
    return Promise.resolve('hello world ' + instance);
  }

  function Component() {
    ++renderCount;
    const unpacked = useReadDeasyncAtom($atom, 42);
    return <div data-testid='test'>{unpacked.status === 'resolved' ? unpacked.result : 'pending'}</div>;
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('pending');
  await expect.element(screen.getByTestId('test')).toHaveTextContent('hello world 42');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadDeasyncAtom() synchronously unpacks known promises returned from functional atoms', async () => {
  let renderCount = 0;
  const returnedPromise = Promise.resolve('a&s');

  deasync(returnedPromise);
  await returnedPromise;

  function $atom() {
    return returnedPromise;
  }

  function Component() {
    ++renderCount;
    const unpacked = useReadDeasyncAtom($atom);
    return <div data-testid='test'>{unpacked.status === 'resolved' ? unpacked.result : 'pending'}</div>;
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('test')).toHaveTextContent('a&s');
  expect(renderCount).toBe(1);
});

test('useReadDeasyncAtom() unpacks rejected promises returned from functional atoms', async () => {
  let renderCount = 0;

  function $atom() {
    return Promise.reject(new Error('expected'));
  }

  function Component() {
    ++renderCount;
    const unpacked = useReadDeasyncAtom($atom);
    return (
      <div>
        <div data-testid='status'>{unpacked.status}</div>
        <div data-testid='error'>{unpacked.status === 'rejected' ? String(unpacked.error) : 'n/a'}</div>
      </div>
    );
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('status')).toHaveTextContent('pending');
  await expect.element(screen.getByTestId('status')).toHaveTextContent('rejected');
  await expect.element(screen.getByTestId('error')).toHaveTextContent('expected');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadDeasyncAtom() synchronously unpacks known rejected promises returned from functional atoms', async () => {
  let renderCount = 0;
  const returnedPromise = Promise.reject(new Error('expected'));

  deasync(returnedPromise);
  await returnedPromise.catch(() => {});

  function $atom() {
    return returnedPromise;
  }

  function Component() {
    ++renderCount;
    const {status, error} = useReadDeasyncAtom($atom);
    return (
      <div>
        <div data-testid='status'>{status}</div>
        <div data-testid='error'>{String(error)}</div>
      </div>
    );
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('status')).toHaveTextContent('rejected');
  await expect.element(screen.getByTestId('error')).toHaveTextContent('expected');
  expect(renderCount).toBe(1);
});

test('useReadDeasyncAtom() rerenders on changes of a functional atom', async () => {
  let renderCount = 0;

  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const {result} = useReadDeasyncAtom($atom);
    return <div data-testid='test'>{String(result)}</div>;
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

test('useReadDeasyncAtom() reads the unpacked value of a generative atom', async () => {
  let renderCount = 0;

  function* $atom() {
    yield Promise.resolve(null);
    return 'made it!';
  }

  function Component() {
    ++renderCount;
    const {status, result} = useReadDeasyncAtom($atom);
    return (
      <div>
        <div data-testid='status'>{status}</div>
        <div data-testid='result'>{String(result)}</div>
      </div>
    );
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('status')).toHaveTextContent('pending');
  await expect.element(screen.getByTestId('status')).toHaveTextContent('resolved');
  await expect.element(screen.getByTestId('result')).toHaveTextContent('made it!');
  expect(renderCount).toBeLessThanOrEqual(2);
});

test('useReadDeasyncAtom() synchronously reads the value of a synchronously computed generative atom', async () => {
  let renderCount = 0;
  const innerPromise = Promise.resolve(456);

  deasync(innerPromise);
  await innerPromise;

  function* $atom() {
    yield innerPromise;
    return 'hi';
  }

  function Component() {
    ++renderCount;
    const {status, result} = useReadDeasyncAtom($atom);
    return (
      <div>
        <div data-testid='status'>{status}</div>
        <div data-testid='result'>{String(result)}</div>
      </div>
    );
  }

  const screen = render(<Component/>);

  await expect.element(screen.getByTestId('status')).toHaveTextContent('resolved');
  await expect.element(screen.getByTestId('result')).toHaveTextContent('hi');
  expect(renderCount).toBe(1);
});

test('useReadDeasyncAtom() rerenders on changes of a generative atom', async () => {
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
    const {status, result} = useReadDeasyncAtom($atom);
    return (
      <div>
        <div data-testid='status'>{status}</div>
        <div data-testid='result'>{String(result)}</div>
      </div>
    );
  }

  const screen = render(<Component/>);
  const result = screen.getByTestId('result');

  await expect.element(result).toHaveTextContent('0');
  expect(renderCount).toBeLessThanOrEqual(2);

  dispatch($atom)(42);
  await expect.element(result).toHaveTextContent('42');
  expect(renderCount).toBeLessThanOrEqual(3);

  invalidate($atom);
  await read($atom);
  await expect.element(result).toHaveTextContent('42');
  expect(renderCount).toBeLessThanOrEqual(3);
});

test('useReadDeasyncAtom() does not rerender if atom is recomputed but its value remains the same', async () => {
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
    const {result} = useReadDeasyncAtom($atom);
    return <div data-testid='test'>{String(result)}</div>;
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

test('useReadDeasyncAtom() supports atom families', async () => {
  let renderCount = 0;

  function $atom(instance: string) {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    const {result: value1} = useReadDeasyncAtom($atom, 'first');
    const {result: value2} = useReadDeasyncAtom($atom, 'second');
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

test('useReadDeasyncAtom() can switch from one store to another', async () => {
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
    const {result} = useReadDeasyncAtom($atom);
    return <div data-testid='test'>{String(result)}</div>;
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

test('useReadDeasyncAtom() can switch from one atom to another', async () => {
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
    const {result} = useReadDeasyncAtom(firstAtom ? $atom1 : $atom2);
    return (
      <>
        <div data-testid='test'>{String(result)}</div>
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

test('useReadDeasyncAtom() preserves the original result reference', async () => {
  const result = {x: 123};
  const $atom = () => result;

  let returnedResult;
  function Component() {
    returnedResult = useReadDeasyncAtom($atom).result;
    return null;
  }

  render(<Component/>);
  expect(returnedResult).toBe(result);
});

test('useReadDeasyncAtom() reports correct value if it changed between first read() and the watch() call', async () => {
  let renderCount = 0;

  function $atom() {
    const [value, setValue] = atomState(10);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    ++renderCount;
    useLayoutEffect(() => {
      // mess up the value before useReadDeasyncAtom can call watch()
      dispatch($atom)(404);
    });
    const {result} = useReadDeasyncAtom($atom);
    return <div data-testid='test'>{String(result)}</div>;
  }

  const screen = render(<Component/>);
  const test = screen.getByTestId('test');

  await expect.element(test).toHaveTextContent('404');
  expect(renderCount).toBe(2);
});
