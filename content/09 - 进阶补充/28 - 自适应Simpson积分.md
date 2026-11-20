# 自适应 Simpson（误差与收敛状态）

端点为有限 long double，f 接收 long double 并返回有限采样值；eps>0、maxDepth>=0；不能只凭误差估计保证高频/奇点积分正确。 允许 b<a 并反号；error 为局部估计累加；深度/浮点分辨率不足时 converged=false。

O(实际采样次数) 时间，栈 O(maxDepth) 空间；最坏 O(2^maxDepth)。

```cpp
namespace numerical_integration {
    using R = long double;
    // 积分结果：value 为积分近似值、error 为非负误差估计、converged 表示估计误差达到目标。
    struct Result {
        R value, error;
        bool converged;
    };
    // 积分[a,b]，返回校正积分值、估计误差与是否在限制内满足eps。
    template <class F> Result simpson(F f, R a, R b, R eps = 1e-12L, int maxDepth = 40) {
        assert(std::isfinite(a) && std::isfinite(b) && eps > 0 && maxDepth >= 0);
        if (a == b)
            return {0, 0, true};
        R sign = 1;
        if (a > b)
            std::swap(a, b), sign = -1;
        auto sample = [&](R x) {
            R v = f(x);
            if (!std::isfinite(v))
                throw std::domain_error("non-finite integrand");
            return v;
        };
        auto area = [](R l, R r, R a, R m, R b) {
            R average = a / 6 + (m / 3) * 2 + b / 6, width = r - l;
            return std::isfinite(width) ? width * average : (r / 2 - l / 2) * average * 2;
        };
        struct Node {
            R l, r, fl, fm, fr, S, eps;
            int depth;
        };
        R mid = std::midpoint(a, b), fa = sample(a), fm = sample(mid), fb = sample(b);
        std::vector<Node> stack{{a, b, fa, fm, fb, area(a, b, fa, fm, fb), eps, 0}};
        Result out{0, 0, true};
        while (!stack.empty()) {
            auto t = stack.back();
            stack.pop_back();
            R m = std::midpoint(t.l, t.r), u = std::midpoint(t.l, m), v = std::midpoint(m, t.r);
            if (u == t.l || v == t.r || m == t.l || m == t.r) {
                out.value += t.S;
                out.error += t.eps;
                out.converged = false;
                continue;
            }
            R fu = sample(u), fv = sample(v), L = area(t.l, m, t.fl, fu, t.fm),
              H = area(m, t.r, t.fm, fv, t.fr), delta = L + H - t.S, error = std::abs(delta) / 15;
            if (!std::isfinite(error)) {
                out.value += L + H;
                out.error = INFINITY;
                out.converged = false;
                continue;
            }
            if (error <= t.eps || t.depth >= maxDepth) {
                out.value += L + H + delta / 15;
                out.error += error;
                if (error > t.eps)
                    out.converged = false;
            } else {
                stack.push_back({m, t.r, t.fm, fv, t.fr, H, t.eps / 2, t.depth + 1});
                stack.push_back({t.l, m, t.fl, fu, t.fm, L, t.eps / 2, t.depth + 1});
            }
        }
        out.value *= sign;
        return out;
    }
}
```
