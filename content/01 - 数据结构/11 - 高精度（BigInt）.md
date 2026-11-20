# 高精度（BigInt，非负定长）

固定十进制 N=1000 位，输入非负，结果须小于 10^N；乘法各槽和进位不能溢出 int。 除数为正 int，(divisor-1)*10 及槽累加不能溢出 int。 BigInt 不支持减法或大数乘除；除法向下取整，输出无前导零。

乘 / 除 int 为 O(N)，加 BigInt 为 O(N)，N 为十进制位宽（默认 1000）；输出 O(N)。

```cpp
constexpr int N = 1000;

// 固定 N 位十进制非负大整数，仅支持 += BigInt、*= int、/= int、<<
struct BigInt {
    int a[N];

    // 由非负 int 构造，默认 0
    BigInt(int x = 0) : a{} {
        for (int i = 0; x; i++) {
            a[i] = x % 10;
            x /= 10;
        }
    }

    // 乘非负 int；结果须小于 10^N
    BigInt &operator*=(int x) {
        for (int i = 0; i < N; i++) {
            a[i] *= x;
        }
        for (int i = 0; i < N - 1; i++) {
            a[i + 1] += a[i] / 10;
            a[i] %= 10;
        }
        return *this;
    }

    // 除正 int，非负整数向下取整；x 不能为 0
    BigInt &operator/=(int x) {
        for (int i = N - 1; i >= 0; i--) {
            if (i) {
                a[i - 1] += a[i] % x * 10;
            }
            a[i] /= x;
        }
        return *this;
    }

    // 加另一个 BigInt；按值保存加数以支持自加，结果须小于 10^N
    BigInt &operator+=(BigInt x) {
        for (int i = 0; i < N; i++) {
            a[i] += x.a[i];
            if (a[i] >= 10) {
                a[i + 1] += 1;
                a[i] -= 10;
            }
        }
        return *this;
    }
};

// 输出十进制表示
std::ostream &operator<<(std::ostream &os, const BigInt &a) {
    int t = N - 1;
    while (t > 0 && a.a[t] == 0) {
        t--;
    }
    for (int i = t; i >= 0; i--) {
        os << a.a[i];
    }
    return os;
}
// 有符号动态高精度整数（DecimalInteger）
```

## 有符号高精度（独立版）

仅需统一主模板，可独立复制。

十进制文本可带一个 +/-，其余须为数字；除数不能为 0。

除法向零截断，余数与被除数同号；没有负零，无固定 1000 位限制。

支持 / 和 % 单独取商、余数；两者都要时用 divmod 只算一次。

d 位加减/比较 O(d)，乘法 O(d²)，长除法 O(d²)，空间 O(d)。

```cpp
class DecimalInteger {
    vector<int> digits{0};
    bool negative = false;
    void normalize() {
        while (digits.size() > 1 && digits.back() == 0)
            digits.pop_back();
        if (digits.size() == 1 && digits[0] == 0)
            negative = false;
    }
    static int compareAbs(const DecimalInteger &a, const DecimalInteger &b) {
        if (a.digits.size() != b.digits.size())
            return a.digits.size() < b.digits.size() ? -1 : 1;
        for (int i = int(a.digits.size()) - 1; i >= 0; i--)
            if (a.digits[i] != b.digits[i])
                return a.digits[i] < b.digits[i] ? -1 : 1;
        return 0;
    }
    static DecimalInteger addAbs(const DecimalInteger &a, const DecimalInteger &b) {
        DecimalInteger c;
        c.digits.clear();
        int carry = 0;
        for (size_t i = 0; i < max(a.digits.size(), b.digits.size()) || carry; i++) {
            int v = carry + (i < a.digits.size() ? a.digits[i] : 0) +
                    (i < b.digits.size() ? b.digits[i] : 0);
            c.digits.push_back(v % 10);
            carry = v / 10;
        }
        c.normalize();
        return c;
    }
    static DecimalInteger subtractAbs(const DecimalInteger &a, const DecimalInteger &b) {
        DecimalInteger c = a;
        c.negative = false;
        int borrow = 0;
        for (size_t i = 0; i < c.digits.size(); i++) {
            int v = c.digits[i] - borrow - (i < b.digits.size() ? b.digits[i] : 0);
            borrow = v < 0;
            c.digits[i] = v + (borrow ? 10 : 0);
        }
        assert(!borrow);
        c.normalize();
        return c;
    }

  public:
    // 从 i64 创建精确整数；支持 LLONG_MIN。
    DecimalInteger(i64 x = 0) {
        negative = x < 0;
        u64 v = x < 0 ? u64(-(x + 1)) + 1 : u64(x);
        digits.clear();
        do {
            digits.push_back(v % 10);
            v /= 10;
        } while (v);
        normalize();
    }
    // 从标准十进制文本创建整数；非法文本抛 invalid_argument。
    explicit DecimalInteger(const string &s) {
        size_t begin = !s.empty() && (s[0] == '-' || s[0] == '+');
        if (begin == s.size())
            throw invalid_argument("integer");
        negative = !s.empty() && s[0] == '-';
        digits.clear();
        for (size_t i = s.size(); i > begin;) {
            char c = s[--i];
            if (c < '0' || c > '9')
                throw invalid_argument("integer");
            digits.push_back(c - '0');
        }
        normalize();
    }
    // 返回是否为 0。
    bool isZero() const {
        return digits.size() == 1 && digits[0] == 0;
    }
    // 返回无前导零的十进制文本。
    string str() const {
        string s = negative ? "-" : "";
        for (auto it = digits.rbegin(); it != digits.rend(); ++it)
            s += char('0' + *it);
        return s;
    }
    // 返回取负的新整数；0 保持为 0。
    DecimalInteger operator-() const {
        auto c = *this;
        if (!c.isZero())
            c.negative = !c.negative;
        return c;
    }
    // 返回精确和。
    friend DecimalInteger operator+(const DecimalInteger &a, const DecimalInteger &b) {
        if (a.negative == b.negative) {
            auto c = addAbs(a, b);
            c.negative = a.negative;
            c.normalize();
            return c;
        }
        int cmp = compareAbs(a, b);
        auto c = cmp >= 0 ? subtractAbs(a, b) : subtractAbs(b, a);
        c.negative = cmp >= 0 ? a.negative : b.negative;
        c.normalize();
        return c;
    }
    // 返回精确差。
    friend DecimalInteger operator-(const DecimalInteger &a, const DecimalInteger &b) {
        return a + (-b);
    }
    // 返回精确积。
    friend DecimalInteger operator*(const DecimalInteger &a, const DecimalInteger &b) {
        DecimalInteger c;
        c.digits.assign(a.digits.size() + b.digits.size(), 0);
        for (size_t i = 0; i < a.digits.size(); i++) {
            int carry = 0;
            for (size_t j = 0; j < b.digits.size() || carry; j++) {
                int v =
                    c.digits[i + j] + carry + (j < b.digits.size() ? a.digits[i] * b.digits[j] : 0);
                c.digits[i + j] = v % 10;
                carry = v / 10;
            }
        }
        c.negative = a.negative != b.negative;
        c.normalize();
        return c;
    }
    // 返回向零截断的商和同被除数符号的余数；除零抛 domain_error。
    pair<DecimalInteger, DecimalInteger> divmod(const DecimalInteger &b) const {
        if (b.isZero())
            throw domain_error("division by zero");
        DecimalInteger divisor = b;
        divisor.negative = false;
        DecimalInteger q, r;
        q.digits.assign(digits.size(), 0);
        for (int i = int(digits.size()) - 1; i >= 0; i--) {
            r.digits.insert(r.digits.begin(), digits[i]);
            r.normalize();
            while (compareAbs(r, divisor) >= 0) {
                r = subtractAbs(r, divisor);
                q.digits[i]++;
            }
        }
        q.negative = negative != b.negative;
        r.negative = negative;
        q.normalize();
        r.normalize();
        return {q, r};
    }
    // 返回向零截断的商。
    friend DecimalInteger operator/(const DecimalInteger &a, const DecimalInteger &b) {
        return a.divmod(b).first;
    }
    // 返回与被除数同号的余数。
    friend DecimalInteger operator%(const DecimalInteger &a, const DecimalInteger &b) {
        return a.divmod(b).second;
    }
    // 返回两整数是否相等。
    friend bool operator==(const DecimalInteger &a, const DecimalInteger &b) {
        return a.negative == b.negative && a.digits == b.digits;
    }
    // 返回 a 是否小于 b。
    friend bool operator<(const DecimalInteger &a, const DecimalInteger &b) {
        if (a.negative != b.negative)
            return a.negative;
        int cmp = compareAbs(a, b);
        return a.negative ? cmp > 0 : cmp < 0;
    }
    // 输出标准十进制文本，返回流引用。
    friend ostream &operator<<(ostream &out, const DecimalInteger &a) {
        return out << a.str();
    }
    // 读取一个十进制整数，非法文本置 failbit，返回流引用。
    friend istream &operator>>(istream &in, DecimalInteger &a) {
        string s;
        if (in >> s) {
            try {
                a = DecimalInteger(s);
            } catch (const invalid_argument &) {
                in.setstate(ios::failbit);
            }
        }
        return in;
    }
    // ponytail: 十进制逐位乘除只适合几千位内常规运算；更大规模改为 1e9 进制和快速乘法。
};
```
