const visit = require('unist-util-visit')

module.exports = ({ markdownAST, markdownNode }, pluginOptions) => {
	const { matchPath, fromHeadingDepth, toHeadingDepth } = pluginOptions
	const {
		fields: { slug },
	} = markdownNode

	/**
	 * Only run on markdown paths that match a given path as option
	 */
	if (!new RegExp(matchPath).test(slug)) {
		return markdownAST
	}

	visit(markdownAST, 'code', (node, index, parent) => {
		const titleNode = {
			type: 'html',
			value: `<div class='openInANewTabLink'>Open In a New Tab</div>`.trim(),
		}
		// parent.children.splice(index, 0, titleNode);
		// console.log(`spliced for rule ${slug} at index ${index}`)
	})
	return markdownAST
}
