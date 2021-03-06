/** @format */

// https://juejin.im/post/5d565015f265da03eb13c575

import React, { useState, useEffect, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'
import './index.scss'

const getRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const translateY = value => {
  return `translateY(${value}px)`
}

const DynamicBarChart = props => {
  const [dataQueue, setDataQueue] = useState([]) // 当前操作的原始数据数组
  const [activeItemIdx, setActiveItemIdx] = useState(0) // 第几“帧”
  const [highestValue, setHighestValue] = useState(0) // “榜首”的数据值
  const [currentValues, setCurrentValues] = useState({}) // 经过处理后用于渲染的数据数组
  // const [firstRun, setFirstRun] = useState(false) // 第一次动态渲染时间

  const iterationTimeoutHolder = useRef(null)

  // let iterationTimeoutHolder: number | null = null // 定时器
  // 动态跑起来～

  // 对下一帧数据进行处理
  setNextValues = useCallback(() => {
    // 没有帧数时（即已结束），停止渲染
    if (!dataQueue[activeItemIdx]) {
      iterationTimeoutHolder.current = null
      return
    }

    //  每一帧的数据数组
    const roundData = dataQueue[activeItemIdx].values

    const nextValues = {}
    let highestValue = 0

    //  处理数据，用作最后渲染（各种样式，颜色）
    roundData.map(c => {
      nextValues[c.id] = {
        ...c,
        color: c.color || (currentValues[c.id] || {}).color || getRandomColor()
      }

      if (Math.abs(c.value) > highestValue) {
        highestValue = Math.abs(c.value)
      }

      return c
    })

    // 属性的操作，触发useEffect
    // 连续触发多次state赋值，方法重新执行几次？
    setCurrentValues(nextValues)
    setHighestValue(highestValue)
    setActiveItemIdx(activeItemIdx + 1)
  }, [activeItemIdx, currentValues, dataQueue])

  // 取原始数据
  useEffect(() => {
    setDataQueue(props.data)
  }, [props.data])

  // 触发动态
  useEffect(() => {
    function start() {
      if (activeItemIdx > 1) {
        return
      }
      setNextValues()
    }
    start()
  }, [activeItemIdx, dataQueue])

  // 设触发动态间隔
  useEffect(() => {
    iterationTimeoutHolder.current = window.setTimeout(nextStep, 1000)

    return () => {
      if (iterationTimeoutHolder.current) {
        window.clearTimeout(iterationTimeoutHolder.current)
      }
    }
  }, [activeItemIdx])

  const keys = Object.keys(currentValues) // 每组数据的索引
  const { barGapSize, barHeight, showTitle, data } = props
  console.table('data', data)
  const maxValue = highestValue / 0.85 // 图表最大宽度
  const sortedCurrentValues = keys.sort((a, b) => currentValues[b].value - currentValues[a].value) // 对每组数据进行排序，该项影响动态渲染。

  const currentItem = dataQueue[activeItemIdx - 1] || {} // 每组的原始数据
  console.log(dataQueue)
  return (
    <div className="live-chart">
      {
        <>
          {showTitle && <h1>{currentItem.name}</h1>}
          <section className="chart">
            <div className="chart-bars" style={{ height: (barHeight + barGapSize) * keys.length }}>
              {sortedCurrentValues.map((key, idx) => {
                const currentValueData = currentValues[key]
                const value = currentValueData.value
                const width = Math.abs((value / maxValue) * 100) //以当前帧最大的value值为准
                let widthStr
                if (isNaN(width) || !width) {
                  widthStr = '1px'
                } else {
                  widthStr = `${width}%`
                }

                return (
                  <div
                    className={`bar-wrapper`}
                    style={{ transform: translateY((barHeight + barGapSize) * idx), transitionDuration: 200 / 1000 }}
                    key={`bar_${key}`}>
                    <label>{!currentValueData.label ? key : currentValueData.label}</label>
                    <div
                      className="bar"
                      style={{
                        height: barHeight,
                        width: widthStr,
                        background:
                          typeof currentValueData.color === 'string'
                            ? currentValueData.color
                            : `linear-gradient(to right, ${currentValueData.color.join(',')})`
                      }}
                    />
                    <span
                      className="value"
                      style={{
                        color:
                          typeof currentValueData.color === 'string'
                            ? currentValueData.color
                            : currentValueData.color[0]
                      }}>
                      {currentValueData.value}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      }
    </div>
  )
}

DynamicBarChart.propTypes = {
  showTitle: PropTypes.bool,
  iterationTimeout: PropTypes.number,
  data: PropTypes.array,
  startRunningTimeout: PropTypes.number,
  barHeight: PropTypes.number,
  barGapSize: PropTypes.number,
  baseline: PropTypes.number
}

DynamicBarChart.defaultProps = {
  showTitle: true,
  iterationTimeout: 200,
  data: [],
  startRunningTimeout: 0,
  barHeight: 50,
  barGapSize: 20,
  baseline: null
}

export { DynamicBarChart }
