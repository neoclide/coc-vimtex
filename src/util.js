/******************************************************************
MIT License http://www.opensource.org/licenses/mit-license.php
Author Qiming Zhao <chemzqm@gmail> (https://github.com/chemzqm)
*******************************************************************/

const conditionRe = /\(\?\(\?:\w+\).+\|/
const bellRe = /\\a/
const commentRe = /\(\?#.*?\)/
const stringStartRe = /\\A/
const lookBehindRe = /\(\?<[!=].*?\)/
const namedCaptureRe = /\(\?P<\w+>.*?\)/
const namedReferenceRe = /\(\?P=(\w+)\)/
const braceRe = /\^\]/
const regex = new RegExp(`${bellRe.source}|${commentRe.source}|${stringStartRe.source}|${lookBehindRe.source}|${namedCaptureRe.source}|${namedReferenceRe.source}|${braceRe}`, 'g')

/**
 * Convert python regex to javascript regex,
 * throw error when unsupported pattern found
 *
 * @public
 * @param {string} str
 * @returns {string}
 */
exports.convertRegex = function(str) {
  if (str.indexOf('\\z') !== -1) {
    throw new Error('pattern \\z not supported')
  }
  if (str.indexOf('(?s)') !== -1) {
    throw new Error('pattern (?s) not supported')
  }
  if (str.indexOf('(?x)') !== -1) {
    throw new Error('pattern (?x) not supported')
  }
  if (str.indexOf('\n') !== -1) {
    throw new Error('multiple line pattern not supported')
  }
  if (conditionRe.test(str)) {
    throw new Error('condition pattern not supported')
  }
  return str.replace(regex, (match, p1) => {
    if (match == '^]') return '^\\]'
    if (match == '\\a') return ''
    if (match.startsWith('(?#')) return ''
    if (match == '\\A') return '^'
    if (match.startsWith('(?<')) return '(?' + match.slice(3)
    if (match.startsWith('(?P<')) return '(?' + match.slice(3)
    if (match.startsWith('(?P=')) return `\\k<${p1}>`
    return ''
  })
}


exports.byteSlice = function (content, start, end) {
  let buf = Buffer.from(content, 'utf8')
  return buf.slice(start, end).toString('utf8')
}
