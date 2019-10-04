/**
 * Get meta data of all WCAG success criteria
 * -> Output file: -> `./_data/sc-urls.json`
 * -> This is later used for hyperlinking SC of rules to respective specifications
 */
const assert = require('assert')
const program = require('commander')
const axios = require('axios')
const createFile = require('../utils/create-file')

/**
 * Parse `args`
 */
program
	.option('-u, --url <url>', 'URL from which WCAG meta data should be fetched and constructed')
	.option('-o, --outputDir <outputDir>', 'output directory to create the meta data')
	.parse(process.argv)

/**
 * Invoke
 */
init(program)
	.catch(e => {
		console.error(e)
		process.write(1)
	})
	.finally(() => console.info('Completed'))

/**
 * Init
 */
async function init({ url, outputDir }) {
	/**
	 * assert `args`
	 */
	assert(url, '`url` is required')
	assert(outputDir, '`outputDir` is required')

	/**
	 * Create a list of success criteria meta data
	 */
	const scMetaData = await getWaiWcagReferenceData(url)
	await createFile(`${outputDir}/sc-urls.json`, JSON.stringify(scMetaData, undefined, 2))

	/**
	 * Create wcag em report tool friendly audit result array
	 */
	const scEmReportAuditResult = Object.values(scMetaData).map(data => {
		return {
			type: 'Assertion',
			test: data.test,
			assertedBy: '_:evaluator',
			subject: '_:website',
			result: {
				outcome: 'earl:inapplicable',
				description: '',
				date: '',
			},
			mode: 'earl:manual',
			hasPart: [],
		}
	})
	await createFile(`${outputDir}/sc-em-report-audit-result.json`, JSON.stringify(scEmReportAuditResult, undefined, 2))
}

/**
 * Determine if a given success criteria is 2.0
 * @param {Object} sc success criterion
 */
function isScWcag20(sc) {
	const is20 = !(sc.versions && sc.versions.length === 1 && sc.versions.includes('2.1'))
	return is20
}

/**
 * Get enhanced meta data of success criterion
 * @param {Object} sc success criteria
 */
function getMetaData(sc) {
	const urlPrefix = `https://www.w3.org/TR/WCAG`
	const is20 = isScWcag20(sc)
	const wcagSuffix = is20 ? '20' : '21'
	const path = is20 ? sc.alt_id[0] : sc.id.split(':').reverse()[0]
	const url = `${urlPrefix}${wcagSuffix}/#${path}`
	const howToMeetUrl = `${
		is20 ? 'http://www.w3.org/WAI/WCAG20/quickref/#qr-' : 'https://www.w3.org/WAI/WCAG21/quickref/#'
	}${path}`
	const understandingUrl = `${
		is20 ? 'http://www.w3.org/TR/UNDERSTANDING-WCAG20/' : 'https://www.w3.org/WAI/WCAG21/Understanding/'
	}/${path}.html`
	/**
	 * Construct `test` - used by `wcag em report tool`
	 */
	const testPrefix = sc.id.split(':').shift()
	const testName = sc.alt_id && sc.alt_id.length > 0 ? sc.alt_id : sc.id
	return {
		num: sc.num,
		url,
		scId: sc.id,
		scAltId: sc.alt_id,
		test: `${testPrefix}:${testName}`,
		howToMeetUrl,
		understandingUrl,
		handle: sc.handle,
		level: sc.level,
		wcagType: wcagSuffix.split('').join('.'),
	}
}

/**
 * Get all WCAG SC reference data
 * @param {String} url URL
 */
async function getWaiWcagReferenceData(url) {
	const {
		data: { principles },
	} = await axios.get(url)

	const scMetaData = {}
	principles.forEach(p =>
		p.guidelines.forEach(g =>
			g.successcriteria.forEach(sc => {
				scMetaData[sc.num] = getMetaData(sc)
			})
		)
	)
	return scMetaData
}