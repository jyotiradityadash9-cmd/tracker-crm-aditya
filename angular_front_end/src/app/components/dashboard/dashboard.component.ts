import { Component, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { DashboardService } from '../../services/dashboard.service';
import { LeadService } from '../../services/lead.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  summary: any = null;
  latestLeads: any[] = [];
  loading = true;
  error = '';

  // Apache ECharts option
  chartOption: EChartsOption = {};

  constructor(
    private dashboardService: DashboardService,
    private leadService: LeadService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadLatestLeads();
  }

  loadDashboardData() {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.buildChart(data.trends);
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load dashboard metrics.';
        this.loading = false;
      }
    });
  }

  loadLatestLeads() {
    this.leadService.getLeads({ page: 1, size: 5, sortBy: 'createdAt', sortOrder: 'DESC' }).subscribe({
      next: res => {
        this.latestLeads = res.leads;
      },
      error: err => console.error('Error loading latest leads for dashboard:', err)
    });
  }

  buildChart(trends: any[]) {
    if (!trends || trends.length === 0) return;

    const dates = trends.map(t => t.date);
    const leadsData = trends.map(t => t.leads);
    const followUpsData = trends.map(t => t.followUps);

    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#94a3b8' }
        }
      },
      legend: {
        data: ['New Leads', 'Follow-Up Interactions'],
        textStyle: { color: '#94a3b8', fontSize: 12 },
        top: 0,
        right: 10,
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 20
      },
      grid: {
        left: 40,
        right: 20,
        top: 40,
        bottom: 30,
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        minInterval: 1
      },
      series: [
        {
          name: 'New Leads',
          type: 'line',
          data: leadsData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#6366f1' },
          itemStyle: {
            color: '#6366f1',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
              ]
            } as any
          }
        },
        {
          name: 'Follow-Up Interactions',
          type: 'line',
          data: followUpsData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#10b981' },
          itemStyle: {
            color: '#10b981',
            borderColor: '#fff',
            borderWidth: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.0)' }
              ]
            } as any
          }
        }
      ]
    };
  }
}
