import { test, expect } from '@playwright/test';
import { renderGraph } from '../../helpers/util.ts';

const linkColorGraph = `sankey
      a,b,10
      `;

const nodeAlignmentGraph = `
        sankey

        a,b,8
        b,c,8
        c,d,8
        d,e,8

        x,c,4
        c,y,4
        `;

const labelStyleGraph = `sankey
        a,b,10
        b,c,10
        `;

const nodeColorsGraph = `sankey
        a,b,10
        b,c,20
        `;

const assertNodeX = async (page, nodeId, expectedX) => {
  const x = await page.locator(`.node[id="${nodeId}"]`).getAttribute('x');
  expect(x).toBe(String(expectedX));
};

test.describe('Sankey Diagram', () => {
  test.describe('when given a linkColor', () => {
    test('links should use hex color', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: '#636465' } });

      const stroke = await page.locator('.link path').getAttribute('stroke');
      expect(stroke).toBe('#636465');
    });

    test('links should be the same color as source node', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'source' } });

      const linkStroke = await page.locator('.link path').getAttribute('stroke');
      const nodeFill = await page.locator('.node[id="node-1"] rect').getAttribute('fill');
      expect(linkStroke).toBe(nodeFill);
    });

    test('links should be the same color as target node', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'target' } });

      const linkStroke = await page.locator('.link path').getAttribute('stroke');
      const nodeFill = await page.locator('.node[id="node-2"] rect').getAttribute('fill');
      expect(linkStroke).toBe(nodeFill);
    });

    test('links must be gradient', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, linkColorGraph, { sankey: { linkColor: 'gradient' } });

      const stroke = await page.locator('.link path').getAttribute('stroke');
      expect(stroke).toBe('url(#linearGradient-3)');
    });
  });

  test.describe('when given a nodeAlignment', () => {
    const assertMainNodes = async (page) => {
      await assertNodeX(page, 'node-1', 0);
      await assertNodeX(page, 'node-2', 100);
      await assertNodeX(page, 'node-3', 200);
      await assertNodeX(page, 'node-4', 300);
      await assertNodeX(page, 'node-5', 400);
    };

    test('should justify nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'justify', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 0);
      await assertNodeX(page, 'node-7', 400);
    });

    test('should align nodes left', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'left', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 0);
      await assertNodeX(page, 'node-7', 300);
    });

    test('should align nodes right', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'right', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 100);
      await assertNodeX(page, 'node-7', 400);
    });

    test('should center nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeAlignmentGraph, {
        sankey: { nodeAlignment: 'center', width: 410, useMaxWidth: false },
      });
      await assertMainNodes(page);
      await assertNodeX(page, 'node-6', 100);
      await assertNodeX(page, 'node-7', 300);
    });
  });

  test.describe('when given a labelStyle', () => {
    test('should render with legacy style by default', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: {} });

      // Default (legacy) style should not have the outlined label classes
      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(0);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(0);
      await expect(page.locator('.node-labels text')).toHaveCount(3);
    });

    test('should render legacy (plain) labels when labelStyle is legacy', async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: { labelStyle: 'legacy' } });

      // Legacy style should not have the outlined label classes
      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(0);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(0);
      await expect(page.locator('.node-labels text')).toHaveCount(3);
    });

    test('should render outlined labels when labelStyle is outlined', async ({
      page,
    }, testInfo) => {
      await renderGraph(page, testInfo, labelStyleGraph, { sankey: { labelStyle: 'outlined' } });

      await expect(page.locator('.node-labels .sankey-label-bg')).toHaveCount(3);
      await expect(page.locator('.node-labels .sankey-label-fg')).toHaveCount(3);
    });
  });

  test.describe('when given nodeWidth and nodePadding', () => {
    test('should respect custom nodeWidth', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `sankey
        a,b,10
        `,
        { sankey: { nodeWidth: 20, useMaxWidth: false } }
      );

      const width = parseFloat(
        (await page.locator('.node rect').first().getAttribute('width')) ?? '0'
      );
      expect(width).toBe(20);
    });

    test('should use default nodeWidth of 10', async ({ page }, testInfo) => {
      await renderGraph(
        page,
        testInfo,
        `sankey
        a,b,10
        `,
        { sankey: { useMaxWidth: false } }
      );

      const width = parseFloat(
        (await page.locator('.node rect').first().getAttribute('width')) ?? '0'
      );
      expect(width).toBe(10);
    });
  });

  test.describe('when given autoHeight', () => {
    test('should preserve proportional widths for a dense layer', async ({ page }, testInfo) => {
      const denseGraph = `sankey
        a,b,10
        c,b,10
        d,b,10
        e,b,10
        f,b,10
        g,b,10
        h,b,10
        i,b,10
        j,b,10
        k,b,10
        l,b,10
        m,b,10
        n,b,10
        o,b,10
        p,b,10
        q,b,10
        r,b,10
        s,b,10
        t,b,10
        u,b,10
        v,b,10
        w,b,10
        x,b,10
        y,b,10
        z,b,10
        b,winning,250
        `;

      await renderGraph(page, testInfo, denseGraph, {
        sankey: { autoHeight: true, useMaxWidth: false },
      });

      const sourceHeight = parseFloat(
        (await page.locator('.node rect').first().getAttribute('height')) ?? '0'
      );
      const targetHeight = parseFloat(
        (await page.locator('.node rect').nth(1).getAttribute('height')) ?? '0'
      );

      expect(sourceHeight).toBeGreaterThan(0);
      expect(targetHeight).toBeGreaterThan(sourceHeight);
      expect(
        parseFloat((await page.locator('.link path').first().getAttribute('stroke-width')) ?? '0')
      ).toBeGreaterThan(1);
    });
  });

  test.describe('when given nodeSort', () => {
    test('should force value order within the selected column', async ({ page }, testInfo) => {
      const graph = `sankey
        a,center,1
        b,center,3
        c,center,2
        center,end,6
        `;

      await renderGraph(page, testInfo, graph, {
        screenshot: false,
        sankey: { nodeSort: ['value-descending'], useMaxWidth: false },
      });

      const sourceNodes = await page.locator('.node[x="0"]')
        .evaluateAll((nodes) =>
          nodes
            .map((node) => ({ id: node.id, y: Number(node.getAttribute('y')) }))
            .sort((a, b) => a.y - b.y)
        );

      expect(sourceNodes.map((node) => node.id)).toEqual(['node-3', 'node-4', 'node-1']);
    });
  });

  test.describe('when given nodeColors', () => {
    test('should apply custom node colors', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeColorsGraph, {
        sankey: { nodeColors: { a: '#ff0000', b: '#00ff00' } },
      });

      const fill = await page.locator('.node').first().locator('rect').getAttribute('fill');
      expect(fill).toBe('#ff0000');
    });

    test('should fall back to default colors for unspecified nodes', async ({ page }, testInfo) => {
      await renderGraph(page, testInfo, nodeColorsGraph, {
        sankey: { nodeColors: { a: '#ff0000' } },
      });

      const firstFill = await page.locator('.node').first().locator('rect').getAttribute('fill');
      expect(firstFill).toBe('#ff0000');

      const secondFill = await page.locator('.node').nth(1).locator('rect').getAttribute('fill');
      expect(secondFill).not.toBe('#ff0000');
    });
  });
});
