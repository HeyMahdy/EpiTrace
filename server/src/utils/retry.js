export async function retry(fn, retries = 3, delay = 300) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }

      // wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
