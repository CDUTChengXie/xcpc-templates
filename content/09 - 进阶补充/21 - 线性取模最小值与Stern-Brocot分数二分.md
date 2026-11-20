# 线性取模最小值

n>=1、m>=1，a、b 可以为负；返回值在 [0,m)。

O(log m) 时间，O(1) 空间。

```cpp
namespace fraction_search {
// 求 i∈[0,n) 的最小余数，返回 [0,m)。
    long long minMod(long long n, long long m, long long a, long long b) {
        assert(n > 0 && m > 0);
        a %= m;
        if (a < 0)
            a += m;
        b %= m;
        if (b < 0)
            b += m;
        long long ans = m;
        while (n) {
            a %= m;
            b %= m;
            if (b < 0)
                b += m;
            ans = std::min(ans, b);
            n = ((__int128)(n - 1) * a + b) / m;
            if (n) {
                b = ((__int128)b - (__int128)m * n) % a;
                if (b < 0)
                    b += a;
            }
            std::swap(a, m);
        }
        return ans;
    }
}
```

## Stern–Brocot 有界分数二分

N>=0、D>=1，pred 随分数增大从 false 变 true，且 pred({1,0}) 必须为 true。

限制 num<=N、1<=den<=D；返回 false/true 两侧，hi.den==0 表示无有界可行解。若 pred(0/1) 为 true，两端均返回 0/1。

O(log²(max(N,D)+1)) 次谓词调用，O(1) 空间。

```cpp
namespace fraction_search {
// 分数 num/den，返回的有限分数已约分；den=0 仅用作正无穷哨兵。
    struct Fraction {
        long long num, den;
    };
    // 在 0<=num<=N、1<=den<=D 中求谓词边界，返回 false/true 两侧；1/0 是无解哨兵。
    template <class F> std::pair<Fraction, Fraction> bounds(long long N, long long D, F pred) {
        assert(N >= 0 && D >= 1);
        Fraction lo{0, 1}, hi{1, 0};
        if (pred(lo))
            return {lo, lo};
        assert(pred(hi));
        auto fit = [&](Fraction a, Fraction b, long long k) {
            return (__int128)a.num + (__int128)b.num * k <= N &&
                   (__int128)a.den + (__int128)b.den * k <= D;
        };
        auto add = [](Fraction a, Fraction b, long long k) {
            return Fraction{(long long)((__int128)a.num + (__int128)b.num * k),
                            (long long)((__int128)a.den + (__int128)b.den * k)};
        };
        while (fit(lo, hi, 1)) {
            bool dir = pred(add(lo, hi, 1));
            Fraction &a = dir ? hi : lo;
            Fraction b = dir ? lo : hi;
            long long cap = LLONG_MAX;
            if (b.num)
                cap = std::min(cap, (N - a.num) / b.num);
            if (b.den)
                cap = std::min(cap, (D - a.den) / b.den);
            long long l = 1, r = cap;
            while (l < r) {
                long long mid = l + (r - l) / 2 + 1;
                if (pred(add(a, b, mid)) == dir)
                    l = mid;
                else
                    r = mid - 1;
            }
            a = add(a, b, l);
        }
        return {lo, hi};
    }
}
```
