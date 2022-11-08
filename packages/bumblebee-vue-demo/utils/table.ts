const optimizeRange = (
  inputRange: [number, number],
  existingRange: [number, number]
): [number, number][] => {
  let resultRanges: [number, number][] = [];

  if (
    existingRange &&
    !(existingRange[1] < inputRange[0] || existingRange[0] > inputRange[1])
  ) {
    if (inputRange[0] < existingRange[0]) {
      resultRanges.push([inputRange[0], existingRange[0]]);
    }
    if (inputRange[1] > existingRange[1]) {
      resultRanges.push([existingRange[1], inputRange[1]]);
    }
  } else {
    resultRanges.push(inputRange);
  }
  return resultRanges;
};

export const optimizeRanges = (
  inputRange: [number, number],
  existingRanges: [number, number][]
): [number, number][] => {
  let resultRanges: [number, number][] = [inputRange];

  existingRanges.forEach((existingRange) => {
    let resultRangesResults: [number, number][][] = resultRanges.map((range) =>
      optimizeRange(range, existingRange)
    );
    resultRanges = resultRangesResults.flat(1);
  });

  return resultRanges;
};
