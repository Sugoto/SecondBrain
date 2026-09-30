import { useEffect, useRef, useState } from "react";
import type { ECharts, EChartsOption } from "echarts";
import * as echarts from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, PieChart, GridComponent, TooltipComponent, LabelLayout, CanvasRenderer]);

export function useECharts(option: EChartsOption) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!element) return;
    const instance = echarts.init(element, undefined, { renderer: "canvas" });
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(element);
    chart.current = instance;
    return () => {
      observer.disconnect();
      instance.dispose();
      chart.current = null;
    };
  }, [element]);

  useEffect(() => {
    chart.current?.setOption(option, { notMerge: true, lazyUpdate: true });
  }, [element, option]);

  return setElement;
}
