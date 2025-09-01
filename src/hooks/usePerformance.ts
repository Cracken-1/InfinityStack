import React, { useEffect, useRef } from 'react'

export function usePerformance(componentName: string) {
  const renderStart = useRef<number>(0)
  const mountTime = useRef<number>(0)

  useEffect(() => {
    mountTime.current = performance.now()
    
    return () => {
      const unmountTime = performance.now()
      const totalTime = unmountTime - mountTime.current
      
      if (totalTime > 100) { // Log components that take >100ms
        console.warn(`${componentName} lifecycle took ${totalTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])

  const measureRender = () => {
    renderStart.current = performance.now()
  }

  const endRender = () => {
    if (renderStart.current > 0) {
      const renderTime = performance.now() - renderStart.current
      if (renderTime > 16) { // 60fps threshold
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`)
      }
    }
  }

  return { measureRender, endRender }
}

export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    const { measureRender, endRender } = usePerformance(componentName)
    
    measureRender()
    const result = React.createElement(Component, props)
    endRender()
    
    return result
  }
}