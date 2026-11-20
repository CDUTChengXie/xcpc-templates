# FFT

a、b 均非空；整数结果须可放 i64，直接取整要求实际浮点误差<0.5。 下标 i 是 x^i 系数，返回长度 a.size()+b.size()-1；负系数可用；不自动取模。 fft 的数组长度是正的 2 的幂，逆变换已除以长度。

O(n log n)；空间 O(n)。

```cpp
using Comp = std::complex<double>;

// 原地正/逆 FFT；a.size() 必须是正的 2 的幂
void fft(std::vector<Comp> &a, bool invert) {
    int n = a.size();
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) {
            j ^= bit;
        }
        j ^= bit;
        if (i < j) {
            std::swap(a[i], a[j]);
        }
    }
    for (int len = 2; len <= n; len <<= 1) {
        double ang = 2 * std::acos(-1) / len * (invert ? -1 : 1);
        Comp wlen(std::cos(ang), std::sin(ang));
        for (int i = 0; i < n; i += len) {
            Comp w(1);
            for (int j = 0; j < len / 2; j++) {
                Comp u = a[i + j], v = a[i + j + len / 2] * w;
                a[i + j] = u + v;
                a[i + j + len / 2] = u - v;
                w *= wlen;
            }
        }
    }
    if (invert) {
        for (auto &x : a) {
            x /= n;
        }
    }
}

// 返回实系数近似卷积；输入须非空
std::vector<double> fftMul(const std::vector<double> &a, const std::vector<double> &b) {
    int n = 1;
    while (n < (int)(a.size() + b.size() - 1)) {
        n <<= 1;
    }
    std::vector<Comp> fa(n), fb(n);
    for (int i = 0; i < (int)a.size(); i++) {
        fa[i] = a[i];
    }
    for (int i = 0; i < (int)b.size(); i++) {
        fb[i] = b[i];
    }
    fft(fa, false);
    fft(fb, false);
    for (int i = 0; i < n; i++) {
        fa[i] *= fb[i];
    }
    fft(fa, true);
    std::vector<double> res(a.size() + b.size() - 1);
    for (int i = 0; i < (int)res.size(); i++) {
        res[i] = fa[i].real();
    }
    return res;
}

// 返回整数卷积；仅限结果可精确取整且不溢出的值域
std::vector<i64> fftMulInt(const std::vector<i64> &a, const std::vector<i64> &b) {
    std::vector<double> da(a.begin(), a.end()), db(b.begin(), b.end());
    auto c = fftMul(da, db);
    std::vector<i64> res(c.size());
    for (int i = 0; i < (int)c.size(); i++) {
        res[i] = std::llround(c[i]);
    }
    return res;
}
```
