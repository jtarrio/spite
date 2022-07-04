export function FirstDegreePolynomial(x0, y0, x1, y1) {
  let coefs = [
    [x0, 1],
    [x1, 1],
  ];
  let res = [y0, y1];
  coefs[0][0] -= coefs[1][0];
  coefs[0][1] = 0;
  res[0] -= res[1];
  res[0] /= coefs[0][0];
  coefs[0][0] = 1;
  res[1] -= res[0] * coefs[1][0];
  coefs[1][0] = 0;
  return x => x * res[0] + res[1];
}

export function SecondDegreePolynomial(x0, y0, x1, y1, x2, y2) {
  let coefs = [
    [x0 * x0, x0, 1],
    [x1 * x1, x1, 1],
    [x2 * x2, x2, 1]
  ];
  let res = [y0, y1, y2];

  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < 3; ++j) {
      coefs[i][j] -= coefs[2][j];
    }
    res[i] -= res[2];
    coefs[i][0] /= coefs[i][1];
    res[i] /= coefs[i][1];
    coefs[i][1] = 1;
  }
  coefs[0][0] -= coefs[1][0];
  coefs[0][1] = 0;
  res[0] -= res[1];

  res[0] /= coefs[0][0];
  coefs[0][0] = 1;

  for (let i = 1; i < 3; ++i) {
    res[i] -= res[0] * coefs[i][0];
    coefs[i][0] = 0;
  }

  res[2] -= res[1] * coefs[2][1];
  coefs[2][1] = 0;

  return x => res[0] * x * x + res[1] * x + res[2];
}

export function ThirdDegreePolynomial(x0, y0, x1, y1, x2, y2, x3, y3) {
  let coefs = [
    [x0 * x0 * x0, x0 * x0, x0, 1],
    [x1 * x1 * x1, x1 * x1, x1, 1],
    [x2 * x2 * x2, x2 * x2, x2, 1],
    [x3 * x3 * x3, x3 * x3, x3, 1]
  ];
  let res = [y0, y1, y2, y3];

  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 4; ++j) {
      coefs[i][j] -= coefs[3][j];
    }
    res[i] -= res[3];
    coefs[i][0] /= coefs[i][2];
    coefs[i][1] /= coefs[i][2];
    res[i] /= coefs[i][2];
    coefs[i][2] = 1;
  }
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < 3; ++j) {
      coefs[i][j] -= coefs[2][j];
    }
    res[i] -= res[2];
    coefs[i][0] /= coefs[i][1];
    res[i] /= coefs[i][1];
    coefs[i][1] = 1;
  }
  coefs[0][0] -= coefs[1][0];
  coefs[0][1] = 0;
  res[0] -= res[1];

  res[0] /= coefs[0][0];
  coefs[0][0] = 1;

  for (let i = 1; i < 4; ++i) {
    res[i] -= res[0] * coefs[i][0];
    coefs[i][0] = 0;
  }

  for (let i = 2; i < 4; ++i) {
    res[i] -= res[1] * coefs[i][1];
    coefs[i][1] = 0;
  }

  res[3] -= res[2] * coefs[3][2];
  coefs[3][2] = 0;

  return x => res[0] * x * x * x + res[1] * x * x + res[2] * x + res[3];
}
