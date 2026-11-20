# 分数（Frac）

分母不能为 0，除数分子不能为 0；交叉乘法、加减及取负不能溢出 T。 不可对 T 的最小负数取绝对值；数值较大可用 `Frac<i128>`。 自动约分且分母为正；公开 num/den 是最简分子/分母；转 double 会损失精度。

四则运算 O(log M)（约分的 gcd），比较 O(1)；M 为分子分母最大绝对值，空间 O(1)。

```cpp
// 类型无关的 gcd：std::gcd 对 __int128 编译不过，故自行实现辗转相除
template <class T> T gcdAbs(T a, T b) {
    if (a < 0)
        a = -a;
    if (b < 0)
        b = -b;
    while (b != 0) {
        T t = a % b;
        a = b;
        b = t;
    }
    return a;
}

// 精确有理数：分子 num、分母 den，恒为最简且 den>0
template <class T> struct Frac {
    T num;
    T den;

    // 默认构造为 0/1
    Frac() : Frac(0, 1) {}
    // 单参构造为整数分数 num_/1
    Frac(T num_) : Frac(num_, 1) {}
    // 构造并约分；den_ 不能为 0，自动令分母为正
    Frac(T num_, T den_) : num(num_), den(den_) {
        if (den < 0) {
            den = -den;
            num = -num;
        }
        T g = gcdAbs(num, den);
        num /= g;
        den /= g;
    }

    // 返回浮点近似值，可能损失精度
    explicit operator double() const {
        return 1. * num / den;
    }

    // 原地加法，返回 *this
    Frac &operator+=(const Frac &rhs) {
        num = num * rhs.den + rhs.num * den;
        den *= rhs.den;
        T g = gcdAbs(num, den);
        num /= g;
        den /= g;
        return *this;
    }
    // 原地减法，返回 *this
    Frac &operator-=(const Frac &rhs) {
        num = num * rhs.den - rhs.num * den;
        den *= rhs.den;
        T g = gcdAbs(num, den);
        num /= g;
        den /= g;
        return *this;
    }
    // 原地乘法，返回 *this
    Frac &operator*=(const Frac &rhs) {
        num *= rhs.num;
        den *= rhs.den;
        T g = gcdAbs(num, den);
        num /= g;
        den /= g;
        return *this;
    }
    // 原地除法；rhs 不能为 0，返回 *this
    Frac &operator/=(const Frac &rhs) {
        T divisor = rhs.num; // rhs 可能就是 *this，先保存尚未修改的分子
        num *= rhs.den;
        den *= divisor;
        if (den < 0) {
            num = -num;
            den = -den;
        }
        T g = gcdAbs(num, den);
        num /= g;
        den /= g;
        return *this;
    }

    // 返回两分数之和
    friend Frac operator+(Frac lhs, const Frac &rhs) {
        return lhs += rhs;
    }
    // 返回两分数之差
    friend Frac operator-(Frac lhs, const Frac &rhs) {
        return lhs -= rhs;
    }
    // 返回两分数之积
    friend Frac operator*(Frac lhs, const Frac &rhs) {
        return lhs *= rhs;
    }
    // 返回两分数之商；rhs 不能为 0
    friend Frac operator/(Frac lhs, const Frac &rhs) {
        return lhs /= rhs;
    }
    // 返回相反数
    friend Frac operator-(const Frac &a) {
        return Frac(-a.num, a.den);
    }
    // 相等比较（交叉乘法，须保证不溢出）
    friend bool operator==(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den == rhs.num * lhs.den;
    }
    // 不等比较
    friend bool operator!=(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den != rhs.num * lhs.den;
    }
    // 小于比较
    friend bool operator<(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den < rhs.num * lhs.den;
    }
    // 大于比较
    friend bool operator>(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den > rhs.num * lhs.den;
    }
    // 小于等于比较
    friend bool operator<=(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den <= rhs.num * lhs.den;
    }
    // 大于等于比较
    friend bool operator>=(const Frac &lhs, const Frac &rhs) {
        return lhs.num * rhs.den >= rhs.num * lhs.den;
    }
    // 输出为 分子/分母
    friend std::ostream &operator<<(std::ostream &os, Frac x) {
        return os << x.num << "/" << x.den;
    }
};
```
