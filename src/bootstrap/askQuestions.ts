// @ts-nocheck

import { checkbox, confirm, select, input } from '@inquirer/prompts';
import { AllAnswers, AllQuestions } from './questions';
export async function askQuestions<Questions extends AllQuestions>(
	questions: Questions,
	allAnswers: AllAnswers,
	key: keyof AllAnswers,
) {
	type questionNames = keyof typeof questions;
	allAnswers[key] = allAnswers[key] || {};
	const answers = allAnswers[key];
	for (const questionName in questions) {
		const question = questions[questionName as questionNames];
		if (question.when && !question.when(allAnswers)) {
			continue;
		}
		const message = typeof question.message === 'function' ? await question.message(allAnswers) : question.message;
		question.message = message;
		if (question.type === 'input') {
			answers[questionName] = await input(question);
		} else if (question.choices) {
			const choices = typeof question.choices === 'function' ? await question.choices(allAnswers) : question.choices;
			if (question.type === 'checkbox') {
				answers[questionName] = await checkbox({ ...question, choices });
			} else answers[questionName] = await select({ ...question, choices });
		} else {
			answers[questionName] = await confirm(question);
		}
	}
	return allAnswers;
}
