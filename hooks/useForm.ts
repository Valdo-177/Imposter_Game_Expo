import { useState } from "react";

type IValidate<T extends object> = {
	[K in keyof T]?: RegExp;
};

const stateToFocuses = <T extends object>(
	state: T,
): Record<string, boolean> => {
	return Object.keys(state).reduce(
		(acc, key) => {
			acc[key] = false;
			return acc;
		},
		{} as Record<string, boolean>,
	);
};

export const useForm = <T extends object>(
	initState: T,
	validator?: IValidate<T>,
) => {
	const inititialFocuses = stateToFocuses(initState);
	const [state, setState] = useState<T>(initState);
	const [focuses, setFocuses] = useState(inititialFocuses);

	const getBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
		return new Promise((resolve, reject) => {
			try {
				const reader = new FileReader();

				reader.onload = () => {
					resolve(reader.result);
				};

				reader.readAsDataURL(file);
			} catch (error) {
				console.log(error);
				reject(error);
			}
		});
	};

	const onChangeFiles = (target: EventTarget & HTMLInputElement, toBase64?: boolean) => {
		const name = target.name;
		const files = target.files;

		if (!files || files.length === 0) return;
		if (files.length === 1) {
			if (toBase64) {
				getBase64(files[0]).then((data) => {
					setState({
						...state,
						[name]: data,
					});
				});
				return;
			}
			setState({
				...state,
				[name]: files[0],
			});
			return
		}

		const list = [];
		for (let i = 0; i < files.length; i++) {
			list.push(files[i]);
		}

		if (toBase64) {
			const promises = list.map((file) => getBase64(file));
			Promise.all(promises).then((data) => {
				setState({
					...state,
					[name]: data,
				});
			});
			return;
		}
		setState({
			...state,
			[name]: list,
		});
	}

	const onChange = (
		target: (EventTarget & HTMLInputElement) | HTMLSelectElement | HTMLTextAreaElement,
	): Promise<void> => {
		return new Promise((resolve) => {
			setState({
				...state,
				[target.name]: target.value,
			});
			return resolve();
		});
	};

	const resetForm = () => {
		setState(initState);
	};

	const isValidRegExpObject = (
		obj: IValidate<T>,
	): obj is IValidate<T> & Record<string, RegExp> => {
		if (typeof obj !== "object" || obj === null) return false;

		for (const key in obj) {
			const value = obj[key];
			if (
				value &&
				typeof value === "object" &&
				value.constructor.name === "RegExp"
			) {
			} else {
				return false;
			}
		}

		return true;
	};

	const validateFieldsText = (key: keyof T) => {
		if (!validator) {
			throw new Error("To use this feature you need the validators.");
		}
		const v = validator[key] as RegExp;
		return !v.test(state[key] as string);
	};

	const toFormData = () => {
		const formData = new FormData();
		for (const key in state) {
			const value = state[key];
			if (value !== null && value !== undefined) {
				formData.append(key, String(value));
			}
		}
		return formData;
	};

	const onChangeFocus = (key?: keyof T) => {
		const f = { ...focuses };
		for (const keys in state) {
			if (keys === key) {
				f[keys] = true;
			} else {
				f[keys] = false;
			}
		}

		setFocuses(f);
	};

	if (validator && !isValidRegExpObject(validator)) {
		throw new Error("All validator fields must be of RegEx type.");
	}

	return {
		...state,
		form: state,
		focuses,
		onChange,
		setForm: setState,
		resetForm,
		getBase64,
		validateFieldsText,
		onChangeFocus,
		toFormData,
		onChangeFiles
	};
};

export default useForm;