const assert = require('assert')
const program = require('commander')
const createFile = require('../utils/create-file')
const getMarkdownData = require('../utils/get-markdown-data')
const actRulesCommunityRulesDir = 'node_modules/act-rules-community/_rules'
const wcag21 = require('./wcag21.json')['@graph']
/**
 * Parse `args`
 */
program
	.option('-r, --rulesDir <rulesDir>', 'Directory containing rules markdown files')
	.option('-o, --outputDir <outputDir>', 'output directory to create the meta data')
	.parse(process.argv)

/**
 * Invoke
 */
init(program)
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(() => console.info('Completed'))

/**
 * Create coverage list for wcag sc
 */
async function init(program) {
	const { rulesDir, outputDir } = program

	/**
	 * assert `args`
	 */
	assert(rulesDir, '`rulesDir` is required')
	assert(outputDir, '`outputDir` is required')

	const RULES_URI = 'https://act-rules.github.io/rules/'
	const testCases = []
	const rulesData = getMarkdownData(actRulesCommunityRulesDir)
	const scs = {}
	for (const { frontmatter } of rulesData) {
		const { id: ruleId, name: ruleName, accessibility_requirements: ruleAccessibilityRequirements } = frontmatter
		const testCase = {
			conformsTo: `${RULES_URI}${ruleId}`,
			description: ruleName,
			isPartOf: [],
			title: ruleName,
			'@id': `${RULES_URI}${ruleId}`,
			'@type': 'earl:TestCase',
		}
		if (ruleAccessibilityRequirements) {
			Object.keys(ruleAccessibilityRequirements)
				.filter(r => r.includes('wcag'))
				.forEach(r => {
					if (ruleAccessibilityRequirements[r].forConformance) {
						const sc_ = r.replace('wcag20:', '').replace('wcag21:', '')
						const scr = wcag21.find(s => {
							return s.title.indexOf(`${sc_} `) > 0
						})
						const idd = scr ? scr['@id'] : sc_
						testCase.isPartOf.push(idd)
					}
				})
		}
		testCases.push(testCase)
	}

	await createFile(`${outputDir}/act-rules.json`, JSON.stringify(testCases, null, 2))
}
