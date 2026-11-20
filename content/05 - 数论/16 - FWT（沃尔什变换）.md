# FWT（沃尔什变换）

a、b 同长且非空，长度为 2 的幂；T 的加减乘不得溢出；XOR 逆变换还需除以长度。 整数 XOR 卷积须能精确除尽；素数模域中数组长度须有逆元，不能用特征 2 的域。 下标是位掩码，结果与输入等长；三种直接卷积不改输入；原地变换 inv=false 为正、true 为逆。

O(2^k × k)；空间 O(2^k)。

```cpp
namespace FWT {
    // 原地或变换，inv=false 为正变换。
    template <class T> void fwtor(std::vector<T> &a, bool inv) {
        int n = a.size();
        for (int len = 1; len < n; len <<= 1) {
            for (int i = 0; i < n; i += 2 * len) {
                for (int j = 0; j < len; j++) {
                    T u = a[i + j], v = a[i + j + len];
                    a[i + j] = u;
                    a[i + j + len] = inv ? v - u : u + v;
                }
            }
        }
    }

    // 原地与变换，inv=false 为正变换。
    template <class T> void fwtand(std::vector<T> &a, bool inv) {
        int n = a.size();
        for (int len = 1; len < n; len <<= 1) {
            for (int i = 0; i < n; i += 2 * len) {
                for (int j = 0; j < len; j++) {
                    T u = a[i + j], v = a[i + j + len];
                    a[i + j] = inv ? u - v : u + v;
                    a[i + j + len] = v;
                }
            }
        }
    }

    // 原地异或变换，inv=false 为正变换。
    template <class T> void fwtxor(std::vector<T> &a, bool inv) {
        int n = a.size();
        for (int len = 1; len < n; len <<= 1) {
            for (int i = 0; i < n; i += 2 * len) {
                for (int j = 0; j < len; j++) {
                    T u = a[i + j], v = a[i + j + len];
                    a[i + j] = u + v;
                    a[i + j + len] = u - v;
                }
            }
        }
        if (inv) {
            for (auto &x : a) {
                x /= n;
            }
        }
    }

    // 返回两个数组的按位或卷积。
    template <class T> std::vector<T> fwtOr(const std::vector<T> &a, const std::vector<T> &b) {
        auto A = a, B = b;
        fwtor(A, false);
        fwtor(B, false);
        for (int i = 0; i < (int)A.size(); i++) {
            A[i] *= B[i];
        }
        fwtor(A, true);
        return A;
    }

    // 返回两个数组的按位与卷积。
    template <class T> std::vector<T> fwtAnd(const std::vector<T> &a, const std::vector<T> &b) {
        auto A = a, B = b;
        fwtand(A, false);
        fwtand(B, false);
        for (int i = 0; i < (int)A.size(); i++) {
            A[i] *= B[i];
        }
        fwtand(A, true);
        return A;
    }

    // 返回两个数组的按位异或卷积。
    template <class T> std::vector<T> fwtXor(const std::vector<T> &a, const std::vector<T> &b) {
        auto A = a, B = b;
        fwtxor(A, false);
        fwtxor(B, false);
        for (int i = 0; i < (int)A.size(); i++) {
            A[i] *= B[i];
        }
        fwtxor(A, true);
        return A;
    }
}
```
