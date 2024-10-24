// =============================================================================
// Sample test
// =============================================================================

import {expect, test} from 'vitest';
import {render} from 'vitest-browser-react'


test('sample', async () => {
  function Component() {
    return (
      <div>
        Hello world
      </div>
    );
  }

  const screen = render(<Component/>);
  const div = screen.getByText('world');
  await expect.element(div).toBeInTheDocument();
  await expect.element(div).toHaveTextContent('Hello world');
});
