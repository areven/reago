// =============================================================================
// Atom dispatch tests
// =============================================================================

import {useReducer, useState} from 'react';
import {atomAction, atomState, createStore, read} from 'reago';
import {StoreProvider, useDispatchAtom} from 'reago-react';
import {expect, test} from 'vitest';
import {render} from 'vitest-browser-react'


test('useDispatchAtom() targets the referenced atom', async () => {
  function $atom() {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    const updateAtom = useDispatchAtom($atom);
    updateAtom(123);
    return null;
  }

  render(<Component/>);
  expect(read($atom)).toBe(123);
});

test('useDispatchAtom() supports atom families', async () => {
  function $atom(instance: string) {
    const [value, setValue] = atomState(0);
    atomAction(setValue, []);
    return value;
  }

  function Component() {
    const updateAtom1 = useDispatchAtom($atom, 'first');
    const updateAtom2 = useDispatchAtom($atom, 'second');
    updateAtom1(83445475);
    updateAtom1(123);
    updateAtom2(456);
    return null;
  }

  render(<Component/>);
  expect(read($atom, 'first')).toBe(123);
  expect(read($atom, 'second')).toBe(456);
  expect(read($atom, 'third')).toBe(0);
});

test('useDispatchAtom() returns the same callback for the same atom instance', async () => {
  let renderCount = 0;
  const $atom = () => {};
  const refs: any[] = [];

  function Component() {
    ++renderCount;
    refs.push(useDispatchAtom($atom));

    const [_tick, rerender] = useReducer(x => x + 1, 0);
    return <button onClick={rerender}>rerender</button>;
  }

  const screen = render(<Component/>);
  const button = screen.getByRole('button');
  await button.click();

  expect(renderCount).toBe(2);
  expect(refs.length).toBe(2);
  expect(refs[0]).toBe(refs[1]);
});

test('useDispatchAtom() returns a different callback if store changes', async () => {
  let renderCount = 0;
  const $atom = () => {};
  const refs: any[] = [];

  const store1 = createStore();
  const store2 = createStore();

  function Component1() {
    const [firstStore, setFirstStore] = useState(true);

    return (
      <StoreProvider store={firstStore ? store1 : store2}>
        <Component2/>
        <button onClick={() => setFirstStore(false)}>toggle</button>
      </StoreProvider>
    );
  }

  function Component2() {
    ++renderCount;
    refs.push(useDispatchAtom($atom));
    return null;
  }

  const screen = render(<Component1/>);
  const button = screen.getByRole('button');
  await button.click();

  expect(renderCount).toBe(2);
  expect(refs.length).toBe(2);
  expect(refs[0]).not.toBe(refs[1]);
});

test('useDispatchAtom() returns a different callback if atom changes ', async () => {
  let renderCount = 0;
  const $atom1 = () => {};
  const $atom2 = () => {};
  const refs: any[] = [];

  function Component() {
    ++renderCount;
    const [firstAtom, setFirstAtom] = useState(true);
    refs.push(useDispatchAtom(firstAtom ? $atom1 : $atom2));
    return <button onClick={() => setFirstAtom(false)}>toggle</button>;
  }

  const screen = render(<Component/>);
  const button = screen.getByRole('button');
  await button.click();

  expect(renderCount).toBe(2);
  expect(refs.length).toBe(2);
  expect(refs[0]).not.toBe(refs[1]);
});

test('useDispatchAtom() returns a different callback if atom args change', async () => {
  let renderCount = 0;
  let familyId = 0;
  const $atom = (family: number) => {};
  const refs: any[] = [];

  function Component() {
    ++renderCount;
    refs.push(useDispatchAtom($atom, ++familyId));

    const [_tick, rerender] = useReducer(x => x + 1, 0);
    return <button onClick={rerender}>rerender</button>;
  }

  const screen = render(<Component/>);
  const button = screen.getByRole('button');
  await button.click();

  expect(renderCount).toBe(2);
  expect(refs.length).toBe(2);
  expect(refs[0]).not.toBe(refs[1]);
});
