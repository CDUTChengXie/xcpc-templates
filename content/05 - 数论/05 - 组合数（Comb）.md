# 组合数（Comb）

先构造 `Comb(n)` 或使用全局 `comb`；通过 `binom(n,m)` 查询，`init(limit)` 可扩展预处理范围。

Z 的模数为素数且使用期间不变；预处理上限须小于模数，数组须能装入内存。 默认表含 0!=1；查询超出已建范围时自动扩到 2*m，该值须可放 int 且小于模数；init 只扩不缩。 fac/invfac 的 m>=0；inv 的 m>=1，表中 inv(0)=0 不表示存在逆元；binom 的非法 n、m 返回 0。

扩容到 n 总时间/空间 O(n)；已预处理范围内单次查询 O(1)。

```cpp
#ifndef XCPC_MODINT
#define XCPC_MODINT

// 返回取模类型的快速幂。
template <class T> constexpr T power(T a, i64 b) {
    T res = 1;
    for (; b; b /= 2, a *= a) {
        if (b % 2) {
            res *= a;
        }
    }
    return res;
}

// 返回 a*b mod p 的原始余数。
constexpr i64 mul(i64 a, i64 b, i64 p) {
    return i64(i128(a) * b % p);
}

// 大模数取模类，模数可编译期固定或运行时设置。
template <i64 P> struct MLong {
    i64 x;

    // 构造值为 0 的取模数。
    constexpr MLong() : x{} {}
    // 用整数构造并规范到 [0,mod)。
    constexpr MLong(i64 x) : x{norm(x % getMod())} {}

    // 动态模数存储。
    static i64 Mod;
    // 返回当前模数。
    constexpr static i64 getMod() {
        return P > 0 ? P : Mod;
    }
    // 设置动态模数，仅 P=0 时生效。
    constexpr static void setMod(i64 Mod_) {
        Mod = Mod_;
    }
    // 只加减一次规范到 [0,mod)；输入须在 [-mod,2*mod) 内。
    constexpr i64 norm(i64 x) const {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    // 返回底层值。
    constexpr i64 val() const {
        return x;
    }
    // 转换为 i64。
    explicit constexpr operator i64() const {
        return x;
    }
    // 返回相反数。
    constexpr MLong operator-() const {
        MLong res;
        res.x = norm(getMod() - x);
        return res;
    }
    // 返回模逆元，要求模数为素数且自身非零。
    constexpr MLong inv() const {
        assert(x != 0);
        return power(*this, getMod() - 2);
    }
    // 乘并赋值。
    constexpr MLong &operator*=(MLong rhs) & {
        x = mul(x, rhs.x, getMod());
        return *this;
    }
    // 加并赋值。
    constexpr MLong &operator+=(MLong rhs) & {
        x = i64((i128(x) + rhs.x) % getMod());
        return *this;
    }
    // 减并赋值。
    constexpr MLong &operator-=(MLong rhs) & {
        x = norm(x - rhs.x);
        return *this;
    }
    // 除并赋值。
    constexpr MLong &operator/=(MLong rhs) & {
        return *this *= rhs.inv();
    }
    // 返回两数乘积。
    friend constexpr MLong operator*(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res *= rhs;
        return res;
    }
    // 返回两数之和。
    friend constexpr MLong operator+(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res += rhs;
        return res;
    }
    // 返回两数之差。
    friend constexpr MLong operator-(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res -= rhs;
        return res;
    }
    // 返回两数之商。
    friend constexpr MLong operator/(MLong lhs, MLong rhs) {
        MLong res = lhs;
        res /= rhs;
        return res;
    }
    // 从流中读入一个取模数。
    friend constexpr std::istream &operator>>(std::istream &is, MLong &a) {
        i64 v;
        if (is >> v)
            a = MLong(v);
        return is;
    }
    // 向流中输出规范值。
    friend constexpr std::ostream &operator<<(std::ostream &os, const MLong &a) {
        return os << a.val();
    }
    // 按规范值判断相等。
    friend constexpr bool operator==(MLong lhs, MLong rhs) {
        return lhs.val() == rhs.val();
    }
    // 按规范值判断不等。
    friend constexpr bool operator!=(MLong lhs, MLong rhs) {
        return lhs.val() != rhs.val();
    }
};

template <> i64 MLong<0LL>::Mod = 1000000007LL;

// 小模数取模类，模数可编译期固定或运行时设置。
template <int P> struct MInt {
    int x;

    // 构造值为 0 的取模数。
    constexpr MInt() : x{} {}
    // 用整数构造并规范到 [0,mod)。
    constexpr MInt(i64 x) : x{norm(int(x % getMod()))} {}

    // 动态模数存储。
    static int Mod;
    // 返回当前模数。
    constexpr static int getMod() {
        return P > 0 ? P : Mod;
    }
    // 设置动态模数，仅 P=0 时生效。
    constexpr static void setMod(int Mod_) {
        Mod = Mod_;
    }
    // 只加减一次规范到 [0,mod)；输入须在 [-mod,2*mod) 内。
    constexpr int norm(int x) const {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    // 返回底层值。
    constexpr int val() const {
        return x;
    }
    // 转换为 int。
    explicit constexpr operator int() const {
        return x;
    }
    // 返回相反数。
    constexpr MInt operator-() const {
        MInt res;
        res.x = norm(getMod() - x);
        return res;
    }
    // 返回模逆元，要求模数为素数且自身非零。
    constexpr MInt inv() const {
        assert(x != 0);
        return power(*this, getMod() - 2);
    }
    // 乘并赋值。
    constexpr MInt &operator*=(MInt rhs) & {
        x = int(1LL * x * rhs.x % getMod());
        return *this;
    }
    // 加并赋值。
    constexpr MInt &operator+=(MInt rhs) & {
        x = int((i64(x) + rhs.x) % getMod());
        return *this;
    }
    // 减并赋值。
    constexpr MInt &operator-=(MInt rhs) & {
        x = norm(x - rhs.x);
        return *this;
    }
    // 除并赋值。
    constexpr MInt &operator/=(MInt rhs) & {
        return *this *= rhs.inv();
    }
    // 返回两数乘积。
    friend constexpr MInt operator*(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res *= rhs;
        return res;
    }
    // 返回两数之和。
    friend constexpr MInt operator+(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res += rhs;
        return res;
    }
    // 返回两数之差。
    friend constexpr MInt operator-(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res -= rhs;
        return res;
    }
    // 返回两数之商。
    friend constexpr MInt operator/(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res /= rhs;
        return res;
    }
    // 从流中读入一个取模数。
    friend constexpr std::istream &operator>>(std::istream &is, MInt &a) {
        i64 v;
        if (is >> v)
            a = MInt(v);
        return is;
    }
    // 向流中输出规范值。
    friend constexpr std::ostream &operator<<(std::ostream &os, const MInt &a) {
        return os << a.val();
    }
    // 按规范值判断相等。
    friend constexpr bool operator==(MInt lhs, MInt rhs) {
        return lhs.val() == rhs.val();
    }
    // 按规范值判断不等。
    friend constexpr bool operator!=(MInt lhs, MInt rhs) {
        return lhs.val() != rhs.val();
    }
};

template <> int MInt<0>::Mod = 1000000007;

template <int V, int P> constexpr MInt<P> CInv = MInt<P>(V).inv();

// 库级默认模数。
#ifndef XCPC_MODINT_P
#define XCPC_MODINT_P
constexpr int P = 1000000007;
#endif
using Z = MInt<P>;

#endif // XCPC_MODINT

// 模素数下的阶乘、逆阶乘与组合数查询。
struct Comb {
    int n;
    std::vector<Z> _fac;
    std::vector<Z> _invfac;
    std::vector<Z> _inv;

    // 构造只含 0! 的空表。
    Comb() : n{0}, _fac{1}, _invfac{1}, _inv{0} {}
    // 构造并预处理到 n。
    Comb(int n) : Comb() {
        init(n);
    }

    // 扩容预处理到 m，已覆盖时不缩小。
    void init(int m) {
        if (m <= n) {
            return;
        }
        _fac.resize(m + 1);
        _invfac.resize(m + 1);
        _inv.resize(m + 1);
        for (int i = n + 1; i <= m; i++) {
            _fac[i] = _fac[i - 1] * i;
        }
        _invfac[m] = _fac[m].inv();
        for (int i = m; i > n; i--) {
            _invfac[i - 1] = _invfac[i] * i;
            _inv[i] = _invfac[i] * _fac[i - 1];
        }
        n = m;
    }

    // 返回 m!。
    Z fac(int m) {
        if (m > n) {
            init(2 * m);
        }
        return _fac[m];
    }
    // 返回 (m!)^{-1}。
    Z invfac(int m) {
        if (m > n) {
            init(2 * m);
        }
        return _invfac[m];
    }
    // 返回 m^{-1}。
    Z inv(int m) {
        if (m > n) {
            init(2 * m);
        }
        return _inv[m];
    }
    // 返回 C(n,m)，越界返回 0。
    Z binom(int n, int m) {
        if (n < m || m < 0) {
            return 0;
        }
        return fac(n) * invfac(m) * invfac(n - m);
    }
} comb;
```
