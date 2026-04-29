import {exec} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {argv, env} from 'node:process';
import axios from 'axios';

const userCredentials = env.DOCRAPTOR_API_KEY || 'YOUR_API_KEY_HERE';

const languages = {
	en: 'guidebook-for-financial-inclusion',
	fr: 'guide-pour-l-inclusion-financiere',
};

const docraptorConfig = lang => ({
	url: 'https://api.docraptor.com/docs',
	method: 'post',
	responseType: 'arraybuffer',
	headers: {
		'Content-Type': 'application/json',
	},
	data: {
		user_credentials: userCredentials,
		doc: {
			test: userCredentials === 'YOUR_API_KEY_HERE' || false,
			document_type: 'pdf',
			document_url: `https://guidebook.financial-inclusion.ca/${lang}/export/index.html`,
			pipeline: 11,
			prince_options: {
				media: 'print',
				baseurl: 'https://guidebook.financial-inclusion.ca/',
				profile: 'PDF/UA-1',
			},
		},
	},
});

if (argv[2] === 'local') {
	console.log('Rendering PDFs using Prince...');

	for (const [lang, filename] of Object.entries(languages)) {
		exec(`prince --pdf-profile='PDF/UA-1' http://localhost:8080/${lang}/export/ -o src/assets/downloads/${filename}.pdf`, (_error, _stdout, _stderr) => {
			console.log(`Saved ${filename}.pdf.`);
		});
	}
} else {
	console.log('Rendering PDFs using DocRaptor...');

	await Promise.all(Object.entries(languages).map(([lang, filename]) =>
		axios(docraptorConfig(lang))
			.then(async response => {
				try {
					await writeFile(`./src/assets/downloads/${filename}.pdf`, response.data, 'binary');
					console.log(`Saved ${filename}.pdf.`);
				} catch (writeError) {
					console.error(writeError);
				}
			})
			.catch(error => {
				const decoder = new TextDecoder('utf-8');
				console.error(decoder.decode(error.response.data));
			})));
}
