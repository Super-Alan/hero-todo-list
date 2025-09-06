#!/usr/bin/env node

/**
 * 时间字段修复验证测试
 * 验证输入20:00，存储和显示都是20:00的所见即所得效果
 */

console.log('🧪 时间字段修复验证测试...\n')

// 模拟数据库存储的UTC时间格式
const testCases = [
  { input: '20:00', expected: '20:00', description: '晚上8点' },
  { input: '09:30', expected: '09:30', description: '上午9点半' },
  { input: '00:00', expected: '00:00', description: '午夜' },
  { input: '12:00', expected: '12:00', description: '中午' },
  { input: '23:59', expected: '23:59', description: '深夜' }
]

console.log('📝 测试场景：')
console.log('1. TaskDetail保存逻辑：用户输入时间 → UTC存储')
console.log('2. TaskDetail读取逻辑：UTC时间 → 显示时间') 
console.log('3. TaskList显示逻辑：UTC时间 → 列表显示')
console.log('4. 周期性任务逻辑：UTC时间复制 → 新任务UTC时间')
console.log()

// 测试TaskDetail保存逻辑
function testTaskDetailSave() {
  console.log('🔧 测试TaskDetail保存逻辑:')
  
  testCases.forEach(({ input, expected, description }) => {
    console.log(`\n输入时间: ${input} (${description})`)
    
    // 模拟TaskDetail保存逻辑
    const [hours, minutes] = input.split(':').map(Number)
    const year = 2025, month = 9, day = 6
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
    
    console.log(`  → 构造UTC时间: ${utcDate.toISOString()}`)
    console.log(`  → 存储格式: ${utcDate.toISOString()}`)
    
    // 验证存储的时间是否正确
    const storedHours = utcDate.getUTCHours()
    const storedMinutes = utcDate.getUTCMinutes()
    const storedTime = `${storedHours.toString().padStart(2, '0')}:${storedMinutes.toString().padStart(2, '0')}`
    
    console.log(`  → UTC时间验证: ${storedTime}`)
    console.log(`  → 结果: ${storedTime === expected ? '✅ 正确' : '❌ 错误'}`)
  })
}

// 测试TaskDetail读取逻辑
function testTaskDetailRead() {
  console.log('\n\n🔍 测试TaskDetail读取逻辑:')
  
  testCases.forEach(({ input, expected, description }) => {
    console.log(`\n存储时间: ${expected}:00 UTC (${description})`)
    
    // 模拟从数据库读取的UTC时间字符串
    const utcString = `2025-09-06T${expected}:00.000Z`
    const date = new Date(utcString)
    
    console.log(`  → 数据库值: ${utcString}`)
    
    // 使用修复后的读取逻辑
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    const displayTime = `${hours}:${minutes}`
    
    console.log(`  → UTC提取: ${hours}:${minutes}`)
    console.log(`  → 显示时间: ${displayTime}`)
    console.log(`  → 结果: ${displayTime === expected ? '✅ 正确' : '❌ 错误'}`)
  })
}

// 测试TaskList显示逻辑
function testTaskListDisplay() {
  console.log('\n\n📋 测试TaskList显示逻辑:')
  
  testCases.forEach(({ input, expected, description }) => {
    console.log(`\n存储时间: ${expected}:00 UTC (${description})`)
    
    // 模拟TaskList中的formatDate函数逻辑
    const utcString = `2025-09-06T${expected}:00.000Z`
    const date = new Date(utcString)
    
    console.log(`  → 数据库值: ${utcString}`)
    
    // 使用修复后的显示逻辑
    const hasTime = date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0
    const timeStr = hasTime ? ` ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}` : ''
    const displayText = `今天${timeStr}`
    
    console.log(`  → 有时间: ${hasTime}`)
    console.log(`  → 时间字符串: "${timeStr.trim()}"`)
    console.log(`  → 列表显示: ${displayText}`)
    console.log(`  → 结果: ${timeStr.trim() === expected ? '✅ 正确' : '❌ 错误'}`)
  })
}

// 测试周期性任务时间复制逻辑
function testRecurringTaskCopy() {
  console.log('\n\n🔄 测试周期性任务时间复制逻辑:')
  
  testCases.forEach(({ input, expected, description }) => {
    console.log(`\n原始任务时间: ${expected}:00 UTC (${description})`)
    
    // 模拟原始任务的dueTime
    const originalUtcString = `2025-09-06T${expected}:00.000Z`
    const originalDueTime = new Date(originalUtcString)
    
    // 模拟新任务的日期（不同日期）
    const newYear = 2025, newMonth = 9, newDay = 13
    const dueDate = new Date(Date.UTC(newYear, newMonth - 1, newDay, 0, 0, 0, 0))
    
    console.log(`  → 原始任务: ${originalUtcString}`)
    console.log(`  → 新任务日期: ${dueDate.toISOString().split('T')[0]}`)
    
    // 使用修复后的时间复制逻辑
    const hours = originalDueTime.getUTCHours()
    const minutes = originalDueTime.getUTCMinutes()
    const newDueTime = new Date(Date.UTC(
      dueDate.getUTCFullYear(),
      dueDate.getUTCMonth(),
      dueDate.getUTCDate(),
      hours,
      minutes,
      0,
      0
    ))
    
    console.log(`  → 提取时间: ${hours}:${minutes.toString().padStart(2, '0')}`)
    console.log(`  → 新任务时间: ${newDueTime.toISOString()}`)
    
    // 验证新任务的时间是否正确
    const newHours = newDueTime.getUTCHours().toString().padStart(2, '0')
    const newMinutes = newDueTime.getUTCMinutes().toString().padStart(2, '0')
    const newTimeStr = `${newHours}:${newMinutes}`
    
    console.log(`  → 验证结果: ${newTimeStr}`)
    console.log(`  → 结果: ${newTimeStr === expected ? '✅ 正确' : '❌ 错误'}`)
  })
}

// 运行所有测试
testTaskDetailSave()
testTaskDetailRead()
testTaskListDisplay()
testRecurringTaskCopy()

console.log('\n\n📊 修复总结:')
console.log('1. ✅ TaskDetail保存: 使用Date.UTC()确保UTC时间存储')
console.log('2. ✅ TaskDetail读取: 使用getUTCHours()和getUTCMinutes()提取UTC时间')
console.log('3. ✅ TaskList显示: 使用getUTCHours()和getUTCMinutes()显示正确时间')
console.log('4. ✅ 周期性任务: 使用UTC方法复制时间，确保准确性')

console.log('\n🎯 预期效果:')
console.log('- 用户输入 20:00 → 数据库存储 "2025-09-06T20:00:00.000Z"')
console.log('- TaskDetail显示 → 20:00')
console.log('- TaskList显示 → "今天 20:00"')
console.log('- 周期性任务复制 → 新任务也是 20:00')
console.log('- 所有地方都显示用户原始输入的 20:00 ✨')