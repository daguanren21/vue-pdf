import { resolveBundledWorkerSrc } from '@daguanren21/vue-pdf'

const output = document.querySelector<HTMLOutputElement>('#worker')
if (output)
  output.value = resolveBundledWorkerSrc()
