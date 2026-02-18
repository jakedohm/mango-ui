<script setup>
	const fieldValidators = await import(`../../../mango/validators/links.js`)

	const props = defineProps({
		name: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			default: ''
		}
	})

	function useField(name, initialValue) {
		const value = ref(initialValue)
		const touched = ref(false)

		const valid = computed(() => {
			const validator = fieldValidators[name]
			return validator(value.value)
		})

		const { methods, form } = inject('mangoForm');
		const { registerField, updateFieldValue, setFieldValid } = methods;

		registerField(name, value.value);

		watch(value, (newValue) => {
			updateFieldValue(name, newValue);
		});

		watch(() => valid.value, (newValid) => {
			setFieldValid(name, newValid);
		}, { immediate: true });

		const error = computed(() => form.errors?.fields?.[name] || (touched.value && !valid.value?.valid ? valid.value.response : null));
		const state = null

		return { valid, error, value, touched, state }
	}

	const { valid, error, value, touched } = useField(props.name, props.value);

	const attrs = useAttrs();
	const inputAttributes = { name: props.name, ...attrs }
</script>

<template>
	<div class="relative">
		<Input v-model="value" :aria-invalid="(!valid.valid && touched) || error" @blur="touched = true" v-bind="inputAttributes" />
		<p v-if="error" class="absolute text-red-500 text-[11px] left-0 -bottom-5">{{ error }}</p>
	</div>
</template>
